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
        $hasLocalFile = $storage->disk()->exists($this->url);
        $localUrl = route('images.file', ['path' => $this->url]);
        $thumbnailUrl = route('images.thumbnail', ['path' => $this->url]);
        if ($this->updated_at) {
            $version = '?v='.$this->updated_at->getTimestamp();
            $localUrl .= $version;
            $thumbnailUrl .= $version;
        }

        $resolvedUrl = $hasLocalFile ? $localUrl : ($this->sourceUrl ?: $localUrl);

        return [
            'id' => $this->id,
            'url' => $resolvedUrl,
            'thumbnailUrl' => $hasLocalFile ? $thumbnailUrl : $resolvedUrl,
            'sourceUrl' => $this->sourceUrl,
            'isNew' => (bool) $this->isNew,
            'lastUsedAt' => $this->last_used_at
                ? Carbon::parse($this->last_used_at)->toISOString()
                : null,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
        ];
    }
}
