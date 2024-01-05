<?php

namespace App\Http\Controllers;

use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlaylistsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Playlist/Playlist');
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
    public function store(Request $request)
    {
        $content = $request->validated('file')->getContent();
        $articles = ArticlesService::generate($content);

        return Inertia::render('Playlists/Show', [
            'articles' => $articles
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Inertia::render('Playlist/Show');
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
