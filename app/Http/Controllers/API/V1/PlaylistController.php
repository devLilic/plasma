<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Playlist;

class PlaylistController extends Controller
{
    public function show(Playlist $playlist)
    {
        return ArticleResource::collection(
            $playlist->articles()->with('image.tags')->orderBy('playlist_order')->get()
        );
    }
}
