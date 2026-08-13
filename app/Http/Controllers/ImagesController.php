<?php

namespace App\Http\Controllers;

use App\Http\Resources\ImageResource;
use App\Models\Image;
use App\Services\Images\ImageStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

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

    public function store(Request $request, ImageStorage $storage)
    {
        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $images = collect($validated['files'])->map(function ($file) use ($storage) {
            $filename = Str::uuid().'.'.$file->guessExtension();
            $storage->disk()->putFileAs('', $file, $filename);

            return Image::create([
                'url' => $filename,
                'sourceUrl' => null,
                'isNew' => true,
                'last_used_at' => now(),
            ]);
        });

        return ImageResource::collection($images);
    }
}
