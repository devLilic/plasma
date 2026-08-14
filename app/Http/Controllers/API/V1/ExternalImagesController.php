<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Tag;
use App\Services\Images\ExternalImageService;
use App\Services\Images\ImageStorage;
use App\Services\Images\ImageThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExternalImagesController extends Controller
{
    public function crop(
        Request $request,
        ExternalImageService $externalImages,
        ImageStorage $storage,
        ImageThumbnailService $thumbnails,
    )
    {
        $validated = $request->validate([
            'data.url' => ['required', 'url:http,https', 'max:2048'],
            'data.section.x' => ['required', 'numeric', 'between:0,100'],
            'data.section.y' => ['required', 'numeric', 'between:0,100'],
            'data.section.width' => ['required', 'numeric', 'gt:0', 'lte:100'],
            'data.section.height' => ['required', 'numeric', 'gt:0', 'lte:100'],
            'data.tags' => ['nullable', 'string', 'max:500'],
            'data.article_id' => ['required', 'integer', 'exists:articles,id'],
        ]);
        $data = $validated['data'];
        $contents = $externalImages->crop($data['url'], $data['section']);
        $filename = Str::uuid().'.jpg';
        $storage->disk()->put($filename, $contents);

        try {
            $thumbnails->generateFromContents($filename, $contents);

            $image = DB::transaction(function () use ($data, $filename) {
                $image = Image::create([
                    'url' => $filename,
                    'sourceUrl' => $data['url'],
                    'isNew' => true,
                    'last_used_at' => now(),
                ]);
                $this->syncTags($image, $data['tags'] ?? '');
                Article::findOrFail($data['article_id'])->update(['image_id' => $image->id]);

                return $image;
            });
        } catch (\Throwable $exception) {
            $thumbnails->delete($filename);
            $storage->disk()->delete($filename);

            throw $exception;
        }

        return ImageResource::make($image->load('tags'));
    }

    private function syncTags(Image $image, string $input): void
    {
        $tagIds = collect(preg_split('/[,;\r\n]+/', $input) ?: [])
            ->map(fn ($tag) => Str::of($tag)->trim()->lower()->limit(80, '')->toString())
            ->filter()
            ->unique()
            ->map(fn ($title) => Tag::firstOrCreate(['title' => $title])->id)
            ->values();

        $image->tags()->sync($tagIds);
    }
}
