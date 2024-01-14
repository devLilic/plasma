<?php

namespace App\Http\Resources;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImageResource extends JsonResource {

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "url" => asset("images/$this->url"),
            "isNew" => (boolean) $this->isNew,
            "tags" => TagResource::collection($this->whenLoaded('tags'))
        ];
    }
}
