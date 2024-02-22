<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Image;
use Illuminate\Http\Request;

class ArticleController extends Controller
{

    public function store(Request $request)
    {
        dd($request);
    }

    public function update(Request $request)
    {
        $article = Article::findOrFail($request['data']['query']['article_id']);
        $image = Image::findOrFail($request['data']['query']['image_id']);
        $image->articles()->save($article);
        return ArticleResource::make($article);
    }

    public function removeBg(Request $request)
    {
        $article = Article::findOrFail($request['article_id']);
        $article->image_id = null;
        $article->save();
        return ArticleResource::make($article);
    }
}
