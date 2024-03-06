<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Playlist;
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
        $date = today()->toString();
        $playlist = Playlist::create([
            'title' => today()->format('d m Y') . ' ' . Str::of($file->getClientOriginalName())->before('.HTM')->toString()
        ]);
        $content = $request->validated('file')->getContent();
        $articles = ArticlesService::generate($content);

        $playlist_order = 1;
        foreach ($articles as $article) {
            Article::create([
                'title' => $article->title,
                'subtitle' => $article->search_slug,
                'slugs' => Arr::join($article->slugs, '||'),
                'intro' => $article->content,
                'article_type' => $article->type,
                'playlist_id' => $playlist->id,
                'playlist_order' => $playlist_order++
            ]);
        }

        return redirect()->to("/playlists/" . $playlist->id);
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
