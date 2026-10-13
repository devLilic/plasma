<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Services\Enps\EnpsWebClient;
use App\Services\Enps\EnpsWebException;
use App\Services\Enps\EnpsWebSession;
use App\Services\Images\ImageMatcher;
use App\Services\Playlists\EnpsPlaylistAdapter;
use App\Services\Playlists\EnpsPlaylistItems;
use App\Services\Playlists\PlaylistImporter;
use App\Services\Playlists\PlaylistSourceStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class EnpsPlaylistImportController extends Controller
{
    public function catalog(Request $request, EnpsWebSession $session): JsonResponse
    {
        $request->validate(['refresh' => ['sometimes', 'boolean']]);
        try {
            $connection = $session->connectionFromSession($request);
            if ($connection === null) {
                $client = new EnpsWebClient;
                $connection = $client->connect();
            } else {
                $client = $session->clientFromSession($request);
                $client->ping($connection['tokens']);
                $connection['playlists'] = $client->refreshPlaylists($connection['tokens'], $connection['homeDatabase'], $connection['homeProgram']);
                $connection['cookies'] = $client->cookies();
                $connection['verifiedAt'] = now()->toIso8601String();
            }
            $session->storeSession($request, $connection);
            $playlists = array_map(function ($item) use ($connection) {
                $existing = $this->existing($connection['homeDatabase'], $item['path'] ?? '', $item['guid'] ?? '');

                return [...$item, 'existingPlaylist' => $existing ? $this->publicPlaylist($existing) : null];
            }, $connection['playlists']);

            return response()->json(['playlists' => $playlists, 'user' => $connection['user']]);
        } catch (EnpsWebException $exception) {
            return $this->error($request, $session, $exception);
        } catch (Throwable) {
            return response()->json(['error' => ['kind' => 'unavailable', 'message' => 'Nu s-a putut încărca lista ENPS. Încearcă din nou.']], 503);
        }
    }

    public function import(Request $request, EnpsWebSession $session, PlaylistSourceStorage $storage, EnpsPlaylistAdapter $adapter, PlaylistImporter $importer, ImageMatcher $images): JsonResponse
    {
        $request->validate([
            'guid' => ['required', 'string', 'max:200'],
            'path' => ['required', 'string', 'max:200'],
            'copy' => ['sometimes', 'boolean'],
            'requestId' => ['sometimes', 'uuid'],
        ]);
        $connection = $session->connectionFromSession($request);
        if ($connection === null) {
            return $this->error($request, $session, new EnpsWebException('expired', 'Deschide din nou conexiunea ENPS pentru a importa playlistul.', 401));
        }
        $selected = collect($connection['playlists'] ?? [])->first(fn ($item) => ($item['guid'] ?? null) === $request->input('guid') && ($item['path'] ?? null) === $request->input('path'));
        if (! is_array($selected)) {
            return response()->json(['error' => ['kind' => 'invalid_request', 'message' => 'Playlistul selectat nu aparține sesiunii ENPS active.']], 422);
        }
        $identity = [$connection['homeDatabase'], $selected['path'], $selected['guid']];
        $requestKey = $request->filled('requestId') ? hash('sha256', $request->user()->id.'|'.$request->input('requestId')) : null;

        try {
            return Cache::lock('enps-import:'.hash('sha256', json_encode($identity)), 120)->block(5, function () use ($request, $session, $storage, $adapter, $importer, $images, $connection, $selected, $identity, $requestKey) {
                if ($requestKey && ($completed = Playlist::where('source_import_key', $requestKey)->first())) {
                    return response()->json(['playlist' => $this->publicPlaylist($completed)]);
                }
                if (! $request->boolean('copy') && ($existing = $this->existing(...$identity))) {
                    return response()->json(['duplicate' => $this->publicPlaylist($existing)], 409);
                }
                $client = $session->clientFromSession($request);
                $payload = $client->rundownWithBasicContent($connection['tokens'], $connection['homeDatabase'], $selected);
                $connection['cookies'] = $client->cookies();
                $session->storeSession($request, $connection);
                $articles = $adapter->articles($payload);
                $previous = $importer->previousArticles();
                $path = $storage->storeEnpsSnapshot($payload);
                try {
                    $playlist = DB::transaction(function () use ($selected, $identity, $path, $requestKey, $articles, $importer, $images, $previous, $payload) {
                        $playlist = Playlist::create([
                            'title' => mb_substr($selected['title'].(! empty($selected['workAt']) ? ' ['.$selected['workAt'].']' : ''), 0, 255),
                            'source_type' => 'enps',
                            'source_enps_database' => $identity[0],
                            'source_enps_path' => $identity[1],
                            'source_enps_guid' => $identity[2],
                            'source_enps_work_at' => $selected['workAt'] ?? null,
                            'source_enps_snapshot_path' => $path,
                            'source_import_key' => $requestKey,
                        ]);
                        $importer->synchronizeArticles($playlist, $articles, $previous, $images);
                        app(EnpsPlaylistItems::class)->synchronize($playlist, $payload);

                        return $playlist;
                    });
                } catch (Throwable $exception) {
                    $storage->deletePath($path);
                    throw $exception;
                }

                return response()->json(['playlist' => $this->publicPlaylist($playlist)], 201);
            });
        } catch (EnpsWebException $exception) {
            return $this->error($request, $session, $exception);
        } catch (Throwable) {
            return response()->json(['error' => ['kind' => 'import_failed', 'message' => 'Playlistul nu a putut fi importat. Încearcă din nou.']], 503);
        }
    }

    private function existing(string $database, string $path, string $guid): ?Playlist
    {
        return Playlist::where('source_type', 'enps')->where('source_enps_database', $database)
            ->where('source_enps_path', $path)->where('source_enps_guid', $guid)->latest('id')->first();
    }

    private function publicPlaylist(Playlist $playlist): array
    {
        return ['id' => $playlist->id, 'title' => $playlist->title, 'url' => route('playlists.show', $playlist, false)];
    }

    private function error(Request $request, EnpsWebSession $session, EnpsWebException $exception): JsonResponse
    {
        if (in_array($exception->kind, ['expired', 'credentials', 'configuration'], true)) {
            $session->clearSession($request);
        }

        return response()->json(['error' => ['kind' => $exception->kind, 'message' => $exception->getMessage()]], $exception->status);
    }
}
