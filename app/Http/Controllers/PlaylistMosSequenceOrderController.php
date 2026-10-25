<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Playlist;
use App\Services\Articles\ArticleMosSequenceOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PlaylistMosSequenceOrderController extends Controller
{
    public function update(Request $request, Playlist $playlist, Article $article, ArticleMosSequenceOrderService $orders): JsonResponse
    {
        if ((int) $article->playlist_id !== (int) $playlist->id) {
            return response()->json(['message' => 'Articolul nu aparține acestui playlist.'], 404);
        }

        $payload = $request->validate([
            'entryOrder' => ['required', 'array', 'max:500'],
            'entryOrder.*' => ['required', 'string', 'max:256', 'distinct'],
            'entryZones' => ['present', 'array', 'max:500'],
        ]);

        if (array_diff(array_keys($request->all()), ['entryOrder', 'entryZones']) !== []) {
            throw ValidationException::withMessages(['payload' => 'Payloadul ordinii MOS conține câmpuri necunoscute.']);
        }

        foreach ($payload['entryZones'] as $entryKey => $zone) {
            if (! is_string($entryKey) || strlen($entryKey) > 256 || ! in_array($zone, ['before', 'after'], true)) {
                throw ValidationException::withMessages(['entryZones' => 'Pozițiile manuale MOS sunt invalide.']);
            }
        }

        return response()->json(['data' => $orders->save($article, $payload['entryOrder'], $payload['entryZones'])]);
    }
}
