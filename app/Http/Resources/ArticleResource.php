<?php

namespace App\Http\Resources;

use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource {

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "block_title" => $this->title,
            "title" => $this->title,
            "subtitle" => $this->subtitle,
            "intro" => $this->intro,
            "slugs" => $this->slugs,
            "article_type" => $this->article_type,
            "playlist_id" => $this->playlist_id,
            "playlist_order" => $this->playlist_order,
            "image" => ImageResource::make(Image::find($this->image_id)),
            "search_by" => ""
        ];
    }
}
