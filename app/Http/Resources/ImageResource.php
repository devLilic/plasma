<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class ImageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $localUrl = Storage::disk('images')->url($this->url);
        if ($this->updated_at) {
            $localUrl .= '?v='.$this->updated_at->getTimestamp();
        }

        return [
            'id' => $this->id,
            'url' => Storage::disk('images')->exists($this->url) ? $localUrl : ($this->sourceUrl ?: $localUrl),
            'sourceUrl' => $this->sourceUrl,
            'isNew' => (bool) $this->isNew,
            'lastUsedAt' => $this->last_used_at
                ? Carbon::parse($this->last_used_at)->toISOString()
                : null,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
        ];
    }
}
