<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Image;
use App\Services\Images\ImageStorage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PlasmaViewerMediaController extends Controller
{
    public function __invoke(Article $article, Image $image, ImageStorage $storage): StreamedResponse
    {
        abort_unless($article->image_id === $image->id, 404);
        abort_unless($storage->disk()->exists($image->url), 404);

        return $storage->disk()->response($image->url, null, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
