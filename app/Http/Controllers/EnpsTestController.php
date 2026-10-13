<?php

namespace App\Http\Controllers;

use App\Services\Enps\EnpsWebClient;
use App\Services\Enps\EnpsWebException;
use App\Services\Enps\EnpsWebSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class EnpsTestController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('ENPS/TestPage', [
            'configuration' => [
                'url' => config('services.enps.url'),
                'domain' => config('services.enps.domain'),
                'timezone' => config('services.enps.timezone'),
                'timeout' => config('services.enps.timeout'),
                'configured' => filled(config('services.enps.username')) && filled(config('services.enps.password')),
            ],
            'connection' => $request->session()->has('enps_web.state')
                ? $request->session()->get('enps_web.state')
                : null,
        ]);
    }

    public function connect(Request $request): JsonResponse
    {
        try {
            $client = new EnpsWebClient;
            $connection = $client->connect();
            app(EnpsWebSession::class)->storeSession($request, $connection);

            return response()->json(['connection' => $this->publicConnection($connection)]);
        } catch (EnpsWebException $exception) {
            return $this->error($request, $exception);
        } catch (Throwable) {
            return $this->errorResponse('error', 'Nu s-a putut inițializa conexiunea ENPS.', 503, $request);
        }
    }

    public function ping(Request $request): JsonResponse
    {
        $connection = app(EnpsWebSession::class)->connectionFromSession($request);
        if ($connection === null) {
            return $this->errorResponse('expired', 'Nu există o sesiune ENPS activă. Conectează-te din nou.', 401, $request);
        }

        try {
            $client = app(EnpsWebSession::class)->clientFromSession($request);
            $tokens = $connection['tokens'];
            $client->ping($tokens);
            $connection['tokens'] = $tokens;
            $connection['cookies'] = $client->cookies();
            $connection['verifiedAt'] = now()->toIso8601String();
            app(EnpsWebSession::class)->storeSession($request, $connection);

            return response()->json(['connection' => $this->publicConnection($connection)]);
        } catch (EnpsWebException $exception) {
            if ($exception->kind === 'expired') {
                app(EnpsWebSession::class)->clearSession($request);
            }

            return $this->error($request, $exception);
        } catch (Throwable) {
            return $this->errorResponse('error', 'Nu s-a putut verifica sesiunea ENPS.', 503, $request);
        }
    }

    public function playlistContent(Request $request): JsonResponse
    {
        $request->validate([
            'guid' => ['required', 'string', 'max:200'],
            'path' => ['required', 'string', 'max:200'],
        ]);

        $connection = app(EnpsWebSession::class)->connectionFromSession($request);
        if ($connection === null) {
            return $this->errorResponse('expired', 'Nu există o sesiune ENPS activă. Conectează-te din nou.', 401, $request);
        }

        $playlist = collect($connection['playlists'] ?? [])->first(fn ($playlist) => is_array($playlist)
            && ($playlist['guid'] ?? null) === $request->string('guid')->toString()
            && ($playlist['path'] ?? null) === $request->string('path')->toString()
        );
        if (! is_array($playlist)) {
            return response()->json(['error' => ['kind' => 'invalid_request', 'message' => 'Playlistul selectat nu aparține sesiunii ENPS active.']], 422);
        }

        try {
            $client = app(EnpsWebSession::class)->clientFromSession($request);
            $tokens = $connection['tokens'];
            $stories = $client->playlistContent($tokens, $connection['homeDatabase'], $playlist);
            $connection['tokens'] = $tokens;
            $connection['cookies'] = $client->cookies();
            app(EnpsWebSession::class)->storeSession($request, $connection);

            return response()->json(['stories' => $stories]);
        } catch (EnpsWebException $exception) {
            if ($exception->kind === 'expired') {
                app(EnpsWebSession::class)->clearSession($request);
            }

            return $this->error($request, $exception);
        } catch (Throwable) {
            return $this->errorResponse('error', 'Nu s-a putut încărca conținutul playlistului ENPS.', 503, $request);
        }
    }

    public function refreshPlaylists(Request $request): JsonResponse
    {
        $connection = app(EnpsWebSession::class)->connectionFromSession($request);
        if ($connection === null) {
            return $this->errorResponse('expired', 'Nu există o sesiune ENPS activă. Conectează-te din nou.', 401, $request);
        }

        try {
            $client = app(EnpsWebSession::class)->clientFromSession($request);
            $tokens = $connection['tokens'];
            $connection['playlists'] = $client->refreshPlaylists($tokens, $connection['homeDatabase'], $connection['homeProgram']);
            $connection['tokens'] = $tokens;
            $connection['cookies'] = $client->cookies();
            $connection['verifiedAt'] = now()->toIso8601String();
            app(EnpsWebSession::class)->storeSession($request, $connection);

            return response()->json(['connection' => $this->publicConnection($connection)]);
        } catch (EnpsWebException $exception) {
            if ($exception->kind === 'expired') {
                app(EnpsWebSession::class)->clearSession($request);
            }

            return $this->error($request, $exception);
        } catch (Throwable) {
            return $this->errorResponse('error', 'Nu s-a putut reîncărca lista de playlisturi ENPS.', 503, $request);
        }
    }

    public function disconnect(Request $request): JsonResponse
    {
        $connection = app(EnpsWebSession::class)->connectionFromSession($request);
        try {
            if ($connection !== null) {
                $client = app(EnpsWebSession::class)->clientFromSession($request);
                $tokens = $connection['tokens'];
                $client->logout($tokens);
            }
        } catch (Throwable) {
            // Always discard the local session, even when ENPS is unreachable.
        } finally {
            app(EnpsWebSession::class)->clearSession($request);
        }

        return response()->json(['connection' => null, 'message' => 'Sesiunea ENPS a fost închisă.']);
    }

    private function publicConnection(array $connection): array
    {
        return [
            'user' => $connection['user'],
            'homeDatabase' => $connection['homeDatabase'],
            'homeProgram' => $connection['homeProgram'],
            'globalTables' => $connection['globalTables'],
            'playlists' => $connection['playlists'],
            'serviceAddress' => $connection['serviceAddress'],
            'verifiedAt' => $connection['verifiedAt'],
        ];
    }

    private function error(Request $request, EnpsWebException $exception): JsonResponse
    {
        if (in_array($exception->kind, ['credentials', 'configuration', 'expired', 'invalid_response'], true)) {
            app(EnpsWebSession::class)->clearSession($request);
        }

        return $this->errorResponse($exception->kind, $exception->getMessage(), $exception->status, $request);
    }

    private function errorResponse(string $kind, string $message, int $status, Request $request): JsonResponse
    {
        return response()->json([
            'error' => ['kind' => $kind, 'message' => $message],
            'connection' => $request->session()->get('enps_web.state'),
        ], $status);
    }
}
