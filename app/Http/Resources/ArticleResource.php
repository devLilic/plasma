<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $articleTypes = $this->article_types ?: array_values(array_filter([$this->article_type]));
        $contentSections = $this->content_sections;
        if (! $contentSections && $this->intro) {
            $contentSections = [[
                'slug' => '',
                'type' => 'INTRO',
                'paragraphs' => preg_split('/\R{2,}/u', trim($this->intro)) ?: [$this->intro],
            ]];
        }

        return [
            'id' => $this->id,
            'block_title' => $this->title,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'technical_title' => $this->technical_title ?: $this->subtitle,
            'intro' => $this->intro,
            'content_sections' => $contentSections ?: [],
            'slugs' => $this->slugs,
            'article_type' => $this->article_type,
            'article_types' => $articleTypes,
            'playlist_id' => $this->playlist_id,
            'playlist_order' => $this->playlist_order,
            'image' => $this->image ? ImageResource::make($this->image) : null,
            'search_by' => '',
        ];
    }
}
