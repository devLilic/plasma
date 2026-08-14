<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Services\Images\ImageStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StoredImageController extends Controller
{
    public function __invoke(Request $request, string $path, ImageStorage $storage): StreamedResponse
    {
        abort_unless(Image::query()->where('url', $path)->exists(), 404);
        abort_unless($storage->disk()->exists($path), 404);

        $downloadName = Str::of($request->string('download_name')->toString())
            ->replaceMatches('/[^\pL\pN._ -]/u', '-')
            ->limit(180, '')
            ->trim()
            ->toString();

        return $storage->disk()->response(
            $path,
            $downloadName ?: null,
            [
                'Cache-Control' => 'private, max-age=31536000, immutable',
                'X-Content-Type-Options' => 'nosniff',
            ],
            $downloadName ? 'attachment' : 'inline',
        );
    }
}
