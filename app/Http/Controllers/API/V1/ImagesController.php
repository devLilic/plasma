<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageResource;
use App\Models\Image;
use App\Models\Tag;
use App\Services\Images\ExternalImageService;
use App\Services\Images\ImageDeletionService;
use App\Services\Images\ImageStorage;
use App\Services\Images\ImageThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ImagesController extends Controller
{
    public function index(Request $request)
    {
        $limit = min(max($request->integer('limit', 30), 1), 100);

        return ImageResource::collection(Image::latest()->limit($limit)->with('tags')->get());
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:80'],
        ]);

        $images = Image::query()
            ->whereHas('tags', fn ($query) => $query->where('title', 'like', '%'.$validated['query'].'%'))
            ->with('tags')
            ->latest()
            ->limit(100)
            ->get();

        return ImageResource::collection($images);
    }

    public function update(
        Request $request,
        Image $image,
        ExternalImageService $externalImages,
        ImageStorage $storage,
        ImageThumbnailService $thumbnails,
    )
    {
        $validated = $request->validate([
            'data.tags' => ['sometimes', 'nullable', 'string', 'max:500'],
            'data.section' => ['sometimes', 'array'],
            'data.section.x' => ['required_with:data.section', 'numeric', 'between:0,100'],
            'data.section.y' => ['required_with:data.section', 'numeric', 'between:0,100'],
            'data.section.width' => ['required_with:data.section', 'numeric', 'gt:0', 'lte:100'],
            'data.section.height' => ['required_with:data.section', 'numeric', 'gt:0', 'lte:100'],
        ]);
        $data = $validated['data'];
        $newContents = null;

        if (! array_key_exists('tags', $data) && ! isset($data['section'])) {
            throw ValidationException::withMessages(['data' => 'Nu există modificări de salvat.']);
        }

        if (isset($data['section'])) {
            if (! $image->sourceUrl) {
                throw ValidationException::withMessages(['data.section' => 'Imaginea nu are o sursă externă pentru recrop.']);
            }
            $newContents = $externalImages->crop($image->sourceUrl, $data['section']);
        }

        DB::transaction(function () use ($image, $data) {
            if (array_key_exists('tags', $data)) {
                $tagIds = collect(preg_split('/[,;\r\n]+/', $data['tags'] ?? '') ?: [])
                    ->map(fn ($tag) => Str::of($tag)->trim()->lower()->limit(80, '')->toString())
                    ->filter()
                    ->unique()
                    ->map(fn ($title) => Tag::firstOrCreate(['title' => $title])->id)
                    ->values();
                $image->tags()->sync($tagIds);
            }
        });

        if ($newContents !== null) {
            try {
                $thumbnails->generateFromContents($image->url, $newContents);

                if (! $storage->disk()->put($image->url, $newContents)) {
                    throw new RuntimeException('Imaginea recropată nu poate fi salvată.');
                }

                $image->touch();
            } catch (\Throwable $exception) {
                $thumbnails->delete($image->url);

                throw $exception;
            }
        }

        return ImageResource::make($image->fresh()->load('tags'));
    }

    public function destroy(Image $image)
    {
        app(ImageDeletionService::class)->delete($image);

        return response()->json(['id' => $image->id]);
    }

    public function stale()
    {
        $images = Image::query()
            ->where('last_used_at', '<', now()->subMonthsNoOverflow(2))
            ->with('tags')
            ->orderBy('last_used_at')
            ->get();

        return ImageResource::collection($images);
    }

    public function cleanStale(Request $request, ImageDeletionService $imageDeletion)
    {
        $validated = $request->validate([
            'data.image_ids' => ['required', 'array', 'min:1', 'max:500'],
            'data.image_ids.*' => ['integer', 'distinct', 'exists:images,id'],
        ]);

        $images = Image::query()
            ->whereIn('id', $validated['data']['image_ids'])
            ->where('last_used_at', '<', now()->subMonthsNoOverflow(2))
            ->get();

        $deletedIds = $images->pluck('id')->values();
        $images->each(fn (Image $image) => $imageDeletion->delete($image));

        return response()->json(['deleted_ids' => $deletedIds]);
    }
}
