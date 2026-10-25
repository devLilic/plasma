<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Services\Enps\EnpsWebClient;
use App\Services\Enps\EnpsWebException;
use App\Services\Enps\EnpsWebSession;
use App\Services\Images\ImageMatcher;
use App\Services\Playlists\EnpsPlaylistAdapter;
use App\Services\Playlists\EnpsPlaylistItems;
use App\Services\Playlists\PlaylistImporter;
use App\Services\Playlists\PlaylistSourceStorage;
use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

class PlaylistsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $playlists = Playlist::orderBy('created_at', 'DESC')->take(6)->get();
        $search = trim($request->string('search')->toString());
        $images = Image::query()
            ->when($search !== '', fn ($query) => $query->whereHas('tags', fn ($tags) => $tags->where('title', 'like', '%'.$search.'%')))
            ->with('tags')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $data = [
            'playlists' => $playlists,
            'images' => ImageResource::collection($images),
            'filters' => ['search' => $search],
        ];

        if (count($playlists) > 0) {
            $data['articles'] = ArticleResource::collection(Article::where('playlist_id', $playlists[0]->id)->with('image.tags')->orderBy('playlist_order')->get());
        }

        return Inertia::render('Playlist/PlaylistPage', $data);

        //        return (count($playlists) > 0) ?
        //            Inertia::render('Playlist/PlaylistPage', [
        //                'playlists' => $playlists,
        //                'articles' => ArticleResource::collection(Article::where('playlist_id', $playlists[0]->id)->get()),
        //            ]) :
        //            Inertia::render('Playlist/PlaylistPage', [
        //                'playlists' => $playlists,
        //            ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(
        FileUploadRequest $request,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
    ) {
        $file = $request->validated('file');

        $previous_articles = app(PlaylistImporter::class)->previousArticles();

        $content = $request->validated('file')->getContent();
        $articles = ArticlesService::generate($content);
        $sourcePath = $sourceStorage->store($file, $content);

        try {
            $playlist = DB::transaction(function () use ($file, $articles, $previous_articles, $imageMatcher, $sourcePath) {
                $playlist = Playlist::create([
                    'title' => today()->format('d m Y').' '.Str::of($file->getClientOriginalName())->before('.HTM')->toString(),
                    'source_htm_path' => $sourcePath,
                ]);
                app(PlaylistImporter::class)->synchronizeArticles($playlist, $articles, $previous_articles, $imageMatcher);

                return $playlist;
            });
        } catch (Throwable $exception) {
            $sourceStorage->deletePath($sourcePath);

            throw $exception;
        }

        $sourceStorage->prune();

        return redirect()->to('/playlists/'.$playlist->id);
    }

    public function refreshParsing(
        Request $request,
        Playlist $playlist,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
        EnpsWebSession $enpsSession,
    ) {
        if ($playlist->source_type === 'enps') {
            return $this->refreshEnpsPlaylist($request, $playlist, $imageMatcher, $sourceStorage, $enpsSession);
        }

        if (! $sourceStorage->exists($playlist)) {
            return back()->withErrors([
                'playlist' => 'Sursa HTM salvată nu mai este disponibilă pentru acest playlist.',
            ]);
        }

        $articles = ArticlesService::generate($sourceStorage->contents($playlist));
        $existingArticles = $playlist->articles()->get();

        DB::transaction(function () use ($playlist, $articles, $existingArticles, $imageMatcher) {
            app(PlaylistImporter::class)->synchronizeArticles(
                $playlist,
                $articles,
                $existingArticles,
                $imageMatcher,
                removeMissing: true,
            );
        });

        return redirect()->route('playlists.show', $playlist)->with('status', 'playlist-refreshed');
    }

    private function refreshEnpsPlaylist(
        Request $request,
        Playlist $playlist,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
        EnpsWebSession $enpsSession,
    ) {
        if (blank($playlist->source_enps_database) || blank($playlist->source_enps_path) || blank($playlist->source_enps_guid)) {
            return back()->withErrors(['playlist' => 'Identificatorii sursei ENPS lipsesc pentru acest playlist.']);
        }

        $connection = $enpsSession->connectionFromSession($request);
        $stage = 'connection';
        try {
            if ($connection === null || blank($connection['tokens']['nom'] ?? null)) {
                $client = new EnpsWebClient;
                $connection = $client->connect();
            } else {
                $client = $enpsSession->clientFromSession($request);
                try {
                    $client->ping($connection['tokens']);
                } catch (EnpsWebException $exception) {
                    if ($exception->kind !== 'expired') {
                        throw $exception;
                    }

                    $enpsSession->clearSession($request);
                    $client = new EnpsWebClient;
                    $connection = $client->connect();
                }
            }
            $stage = 'source';
            try {
                $payload = $client->rundownWithBasicContent($connection['tokens'], $playlist->source_enps_database, [
                    'path' => $playlist->source_enps_path,
                    'guid' => $playlist->source_enps_guid,
                ]);
            } catch (EnpsWebException $exception) {
                if ($exception->kind !== 'expired') {
                    throw $exception;
                }

                $enpsSession->clearSession($request);
                $client = new EnpsWebClient;
                $connection = $client->connect();
                $payload = $client->rundownWithBasicContent($connection['tokens'], $playlist->source_enps_database, [
                    'path' => $playlist->source_enps_path,
                    'guid' => $playlist->source_enps_guid,
                ]);
            }
            $connection['cookies'] = $client->cookies();
            $connection['verifiedAt'] = now()->toIso8601String();
            $enpsSession->storeSession($request, $connection);

            // Parse and validate the complete response before staging or changing persisted data.
            $stage = 'parsing';
            $articles = app(EnpsPlaylistAdapter::class)->articles($payload);
            $stage = 'snapshot';
            $newSnapshotPath = $sourceStorage->storeEnpsSnapshot($payload);
            $previousSnapshotPath = $playlist->source_enps_snapshot_path;
            $existingArticles = $playlist->articles()->get();

            $stage = 'persistence';
            try {
                DB::transaction(function () use ($playlist, $articles, $existingArticles, $imageMatcher, $newSnapshotPath, $payload) {
                    app(PlaylistImporter::class)->synchronizeArticles(
                        $playlist,
                        $articles,
                        $existingArticles,
                        $imageMatcher,
                        removeMissing: true,
                    );
                    app(EnpsPlaylistItems::class)->synchronize($playlist, $payload);
                    $playlist->update(['source_enps_snapshot_path' => $newSnapshotPath]);
                });
            } catch (Throwable $exception) {
                $sourceStorage->deletePath($newSnapshotPath);
                throw $exception;
            }

            if ($previousSnapshotPath && $previousSnapshotPath !== $newSnapshotPath) {
                $sourceStorage->deletePath($previousSnapshotPath);
            }
        } catch (EnpsWebException $exception) {
            if ($exception->kind === 'expired') {
                $enpsSession->clearSession($request);
            }

            return back()->withErrors(['playlist' => $exception->getMessage()]);
        } catch (Throwable $exception) {
            Log::warning('Refresh ENPS eșuat.', [
                'playlist_id' => $playlist->id,
                'stage' => $stage,
                'exception_type' => get_class($exception),
            ]);

            return back()->withErrors(['playlist' => 'Playlistul nu a putut fi actualizat. Datele existente au fost păstrate; încearcă din nou.']);
        }

        return redirect()->route('playlists.show', $playlist)->with('status', 'playlist-refreshed');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id, PlaylistSourceStorage $sourceStorage)
    {
        $playlist = Playlist::find($id);
        if (! $playlist) {
            return redirect()->to('/playlists');
        }

        return Inertia::render('Playlist/PlaylistShowPage', [
            'playlist' => [
                'id' => $playlist->id,
                'title' => $playlist->title,
                'source_type' => $playlist->source_type,
                'can_refresh_parsing' => $playlist->source_type === 'enps'
                    ? filled($playlist->source_enps_database) && filled($playlist->source_enps_path) && filled($playlist->source_enps_guid)
                    : $sourceStorage->exists($playlist),
            ],
            'articles' => ArticleResource::collection(Article::where('playlist_id', $id)->with('image.tags')->orderBy('playlist_order')->get()),
        ]);
    }

    /**
     * Remove a playlist and its articles while preserving the media library.
     */
    public function destroy(Playlist $playlist, PlaylistSourceStorage $sourceStorage)
    {
        $playlist->delete();
        $sourceStorage->delete($playlist);

        return redirect()->route('playlists.index');
    }
}
