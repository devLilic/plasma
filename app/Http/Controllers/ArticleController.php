<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use Illuminate\Http\Request;

class ArticleController extends Controller {

    public function store(Request $request)
    {
//        dd($request);
        $playlist = Playlist::findOrFail($request['data']['playlist_id']);

        $articles = $playlist->articles()->orderBy('playlist_order', 'ASC')->get();

        foreach ($articles as $article) {
            if ($article->playlist_order >= $request['data']['position']) {
                $order = $article->playlist_order + 1;
                $article->update(['playlist_order' => $order]);
            }
        }
        Article::create([
            'title' => $request['data']['title'],
            'subtitle' => $request['data']['title'],
            'article_type' => $request['data']['articleType'],
            'playlist_id' => $playlist->id,
            'playlist_order' => $request['data']['position'],
        ]);
        return ArticleResource::collection($playlist->articles()->get());

//        dd($request['data'], $articles);
    }

    public function update(Request $request)
    {
        $article = Article::findOrFail($request['data']['query']['article_id']);
        $image = Image::findOrFail($request['data']['query']['image_id']);
        $image->articles()->save($article);

        return ArticleResource::make($article);
    }

    public function destroy(Request $request)
    {
        $article = Article::find($request->id);
        $article->delete();

        return response()->json(['message' => 'OK']);
    }

    public function removeBg(Request $request)
    {
        $article = Article::findOrFail($request['article_id']);
        $article->image_id = null;
        $article->save();

        return ArticleResource::make($article);
    }
}
