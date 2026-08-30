<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\PlasmaViewer\PlasmaViewerClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Throwable;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class PlasmaViewerController extends Controller
{
    public function state(PlasmaViewerClient $client): JsonResponse
    {
        return $this->respond(fn () => $client->state());
    }

    public function command(Request $request, PlasmaViewerClient $client): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:show,transform,hide,window,reset-transform'],
            'article_id' => ['required_if:type,show', 'integer', 'exists:articles,id'],
            'transform' => ['required_if:type,show,transform', 'array'],
            'transform.brightness' => ['required_with:transform', 'numeric', 'between:0,200'],
            'transform.contrast' => ['required_with:transform', 'numeric', 'between:0,200'],
            'transform.saturation' => ['required_with:transform', 'numeric', 'between:0,200'],
            'transform.zoom' => ['required_with:transform', 'numeric', 'between:1,4'],
            'transform.panX' => ['required_with:transform', 'numeric', 'between:-100,100'],
            'transform.panY' => ['required_with:transform', 'numeric', 'between:-100,100'],
            'transform.flipX' => ['required_with:transform', 'boolean'],
            'window' => ['required_if:type,window', 'array'],
            'window.displayId' => ['sometimes', 'nullable', 'string', 'max:64'],
            'window.fullscreen' => ['sometimes', 'boolean'],
            'window.topmost' => ['sometimes', 'boolean'],
        ]);

        $payload = match ($data['type']) {
            'show' => $this->showPayload(Article::with('image')->findOrFail($data['article_id']), $data['transform']),
            'transform' => $data['transform'],
            'window' => $data['window'],
            default => (object) [],
        };

        $command = [
            'id' => (string) Str::uuid(),
            'version' => 1,
            'timestamp' => now()->toISOString(),
            'type' => $data['type'],
            'payload' => $payload,
        ];

        return $this->respond(fn () => $client->command($command));
    }

    private function showPayload(Article $article, array $transform): array
    {
        abort_unless($article->image, 422, 'Articolul nu are o imagine asociată.');

        return [
            'image' => [
                'imageId' => $article->image->id,
                'articleId' => $article->id,
                'title' => $article->title ?: $article->subtitle,
                'url' => URL::temporarySignedRoute('viewer.media', now()->addMinutes(10), [
                    'article' => $article->id,
                    'image' => $article->image->id,
                ]),
            ],
            'transform' => $transform,
        ];
    }

    private function respond(callable $operation): JsonResponse
    {
        try {
            return response()->json($operation());
        } catch (Throwable $error) {
            report($error);
            $status = $error instanceof HttpExceptionInterface ? $error->getStatusCode() : 503;
            return response()->json(['error' => $error->getMessage()], $status);
        }
    }
}
