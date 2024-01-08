<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Models\Article;
use App\Models\Playlist;
use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PlaylistsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Playlist/PlaylistPage');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(FileUploadRequest $request)
    {
        $file = $request->validated('file');
        $playlist = Playlist::create([
            'title' => Str::of($file->getClientOriginalName())->before('.HTM')->toString()
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
        return redirect()->to("/playlists/".$playlist->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $playlist = Playlist::find($id);
        if(!$playlist) {
            return redirect()->to("/playlists");
        }
        return Inertia::render('Playlist/PlaylistShowPage', [
            'articles' => Article::where('playlist_id', $id)->get()
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
