<?php

namespace App\Http\Resources;

use App\Services\Images\ImageStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ImageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $storage = app(ImageStorage::class);
        $localUrl = route('images.file', ['path' => $this->url]);
        if ($this->updated_at) {
            $localUrl .= '?v='.$this->updated_at->getTimestamp();
        }

        return [
            'id' => $this->id,
            'url' => $storage->disk()->exists($this->url) ? $localUrl : ($this->sourceUrl ?: $localUrl),
            'sourceUrl' => $this->sourceUrl,
            'isNew' => (bool) $this->isNew,
            'lastUsedAt' => $this->last_used_at
                ? Carbon::parse($this->last_used_at)->toISOString()
                : null,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
        ];
    }
}
