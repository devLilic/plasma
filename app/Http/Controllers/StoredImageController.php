<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Services\Images\ImageStorage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StoredImageController extends Controller
{
    public function __invoke(string $path, ImageStorage $storage): StreamedResponse
    {
        abort_unless(Image::query()->where('url', $path)->exists(), 404);
        abort_unless($storage->disk()->exists($path), 404);

        return $storage->disk()->response($path);
    }
}
