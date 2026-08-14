<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Services\Images\ImageStorage;
use App\Services\Images\ImageThumbnailService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StoredImageThumbnailController extends Controller
{
    public function __invoke(
        string $path,
        ImageStorage $storage,
        ImageThumbnailService $thumbnails,
    ): StreamedResponse {
        abort_unless(Image::query()->where('url', $path)->exists(), 404);
        abort_unless($storage->disk()->exists($path), 404);

        $thumbnailPath = $thumbnails->ensure($path);

        return $storage->disk()->response($thumbnailPath, null, [
            'Cache-Control' => 'private, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
