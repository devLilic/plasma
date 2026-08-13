<?php

namespace App\Services\Images;

use App\Models\Article;
use App\Models\Image;
use Illuminate\Support\Facades\DB;

class ImageDeletionService
{
    public function __construct(private readonly ImageStorage $storage) {}

    public function delete(Image $image): void
    {
        $path = $image->url;

        DB::transaction(function () use ($image) {
            $image->tags()->detach();
            Article::where('image_id', $image->id)->update(['image_id' => null]);
            $image->delete();
        });

        $this->storage->disk()->delete($path);
    }
}
