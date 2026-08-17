<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ArticleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'data.playlist_id' => ['required', 'integer', 'exists:playlists,id'],
            'data.title' => ['required', 'string', 'max:255'],
            'data.articleType' => ['required', Rule::in(['BETA', 'OFF', 'LIVE'])],
            'data.position' => ['required', 'integer', 'min:1'],
        ])['data'];

        $playlist = DB::transaction(function () use ($validated) {
            $playlist = Playlist::query()->lockForUpdate()->findOrFail($validated['playlist_id']);
            $playlist->articles()
                ->where('playlist_order', '>=', $validated['position'])
                ->increment('playlist_order');
            $playlist->articles()->create([
                'title' => $validated['title'],
                'subtitle' => $validated['title'],
                'technical_title' => $validated['title'],
                'article_type' => $validated['articleType'],
                'article_types' => [$validated['articleType']],
                'content_sections' => [],
                'playlist_order' => $validated['position'],
            ]);

            return $playlist;
        });

        return ArticleResource::collection(
            $playlist->articles()->with('image.tags')->orderBy('playlist_order')->get()
        );
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'data.query.article_id' => ['required', 'integer', 'exists:articles,id'],
            'data.query.image_id' => ['required', 'integer', 'exists:images,id'],
        ])['data']['query'];

        $article = Article::findOrFail($validated['article_id']);
        $image = Image::findOrFail($validated['image_id']);
        DB::transaction(function () use ($article, $image) {
            $article->update(['image_id' => $image->id]);
            $image->update(['last_used_at' => now()]);
        });

        return ArticleResource::make($article->fresh()->load('image.tags'));
    }

    public function updateContent(Request $request, Article $article)
    {
        $validated = $request->validate([
            'data.title' => ['required', 'string', 'max:255'],
            'data.subtitle' => ['required', 'string', 'max:255'],
        ])['data'];
        $article->update($validated);

        return ArticleResource::make($article->fresh()->load('image.tags'));
    }

    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:articles,id'],
        ]);

        DB::transaction(function () use ($validated) {
            $article = Article::query()->lockForUpdate()->findOrFail($validated['id']);
            Article::where('playlist_id', $article->playlist_id)
                ->where('playlist_order', '>', $article->playlist_order)
                ->decrement('playlist_order');
            $article->delete();
        });

        return response()->json(['message' => 'OK']);
    }

    public function removeBg(Request $request)
    {
        $validated = $request->validate([
            'article_id' => ['required', 'integer', 'exists:articles,id'],
        ]);
        $article = Article::findOrFail($validated['article_id']);
        $article->update(['image_id' => null]);

        return ArticleResource::make($article->fresh()->load('image.tags'));
    }
}
