<?php

namespace App\Http\Controllers;

use App\Http\Resources\ImageResource;
use App\Models\Image;
use App\Services\Images\ImageStorage;
use App\Services\Images\ImageThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

class ImagesController extends Controller
{
    public function index(Request $request)
    {
        $search = trim($request->string('search')->toString());
        $images = Image::query()
            ->when($search !== '', fn ($query) => $query->whereHas('tags', fn ($tags) => $tags->where('title', 'like', '%'.$search.'%')))
            ->with('tags')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Images/ImagesPage', [
            'images' => ImageResource::collection($images),
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Upload/UploadPage');
    }

    public function store(Request $request, ImageStorage $storage, ImageThumbnailService $thumbnails)
    {
        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $images = collect($validated['files'])->map(function ($file) use ($storage, $thumbnails) {
            $filename = Str::uuid().'.'.$file->guessExtension();
            // On Windows, PHP uploads may have a usable pathname while getRealPath()
            // returns an empty value. FilesystemAdapter::putFileAs() relies on
            // getRealPath(), so store the validated upload contents directly instead.
            if (! $storage->disk()->put($filename, $file->getContent())) {
                throw new \RuntimeException('Imaginea încărcată nu a putut fi salvată.');
            }

            try {
                $thumbnails->generate($filename);

                return Image::create([
                    'url' => $filename,
                    'sourceUrl' => null,
                    'isNew' => true,
                    'last_used_at' => now(),
                ]);
            } catch (Throwable $exception) {
                $thumbnails->delete($filename);
                $storage->disk()->delete($filename);

                throw $exception;
            }
        });

        return ImageResource::collection($images);
    }
}
