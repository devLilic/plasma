<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Playlist;
use App\Models\Tag;
use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PlaylistsController extends Controller {

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $playlists = Playlist::orderBy('created_at', 'DESC')->take(6)->get();

        return (count($playlists) > 0) ?
            Inertia::render('Playlist/PlaylistPage', [
                'playlists' => $playlists,
                'articles' => ArticleResource::collection(Article::where('playlist_id', $playlists[0]->id)->get()),
            ]) :
            Inertia::render('Playlist/PlaylistPage', [
                'playlists' => $playlists,
            ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(FileUploadRequest $request)
    {
        $file = $request->validated('file');
        $previous_articles = Playlist::latest()->first()->articles;
        $content = $request->validated('file')->getContent();
        $articles = ArticlesService::generate($content);

        $playlist = Playlist::create([
            'title' => today()->format('d m Y') . ' ' . Str::of($file->getClientOriginalName())->before('.HTM')->toString()
        ]);
        $playlist_order = 1;
        foreach ($articles as $article) {
            $image = $this->findImage($previous_articles, $article->search_slug);
            Article::create([
                'title' => $article->title,
                'subtitle' => $article->search_slug,
                'slugs' => Arr::join($article->slugs, '||'),
                'intro' => $article->content,
                'article_type' => $article->type,
                'playlist_id' => $playlist->id,
                'playlist_order' => $playlist_order++,
                'image_id' => $image ?: null
            ]);
        }

        return redirect()->to("/playlists/" . $playlist->id);
    }

    private function findImage($previous_articles, $slug)
    {
        $found_article = $previous_articles->where('subtitle', $slug)->first();
        if ($found_article) {
            return $found_article->image_id;
        }

        $slug_words = explode(" ", trim($slug));
        $filtered = [];
        foreach($slug_words as $word){
            if (! (int) $word && strlen($word) > 2){
                array_push($filtered, $word);
            }
        }
        $slug = implode(' ', $filtered);
        $found_article = $previous_articles->where('subtitle', $slug)->first();
        if ($found_article) {
            return $found_article->image_id;
        }

        $suggested_images = collect();
        foreach ($filtered as $word){
            $tag = Tag::where('title', "LIKE", "%" .$word."%")->first();
            if ($tag) {
                $suggested_images->push($tag->images()->latest()->first());
            }
        }
        if(count($suggested_images) !== 0 ){
            return $suggested_images->sortByDesc('updated_at')->first()->id;
        }
        return null;
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $playlist = Playlist::find($id);
        if (!$playlist) {
            return redirect()->to("/playlists");
        }

        return Inertia::render('Playlist/PlaylistShowPage', [
            'articles' => ArticleResource::collection(Article::where('playlist_id', $id)->get())
        ]);
    }

}
