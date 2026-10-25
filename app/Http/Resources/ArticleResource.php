<?php

namespace App\Http\Resources;

use App\Services\Enps\EnpsBasicContent;
use App\Services\Articles\ArticleMosTimeline;
use App\Services\Articles\MosOverrideService;
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

        $mosOverrides = app(MosOverrideService::class);
        $sourceMosObjects = $mosOverrides->objectsForArticle($this->resource, applyOverrides: false);
        $mosObjects = $mosOverrides->objectsForArticle($this->resource);
        $mosTimeline = app(ArticleMosTimeline::class)->forArticle($this->resource, $sourceMosObjects, $contentSections ?: []);
        $effectiveByKey = collect($mosObjects)->filter(fn ($object) => is_string($object['objectKey'] ?? null))->keyBy('objectKey');
        foreach ($mosTimeline as &$entry) {
            $sourceObject = $entry['object'] ?? null;
            $objectKey = is_array($sourceObject) ? ($sourceObject['objectKey'] ?? null) : null;
            if (is_string($objectKey) && ($effective = $effectiveByKey->get($objectKey))) {
                $entry['object'] = [...$sourceObject,
                    'objectKey' => $effective['objectKey'],
                    'memberObjectKeys' => $effective['memberObjectKeys'],
                    'revision' => $effective['revision'],
                    'editable' => $effective['editable'],
                    'editableObjects' => $effective['editableObjects'],
                ];
            }
        }
        unset($entry);

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
            'enps_marker_color' => $this->enps_marker_color,
            'mos_objects' => $mosObjects,
            'mos_timeline' => $mosTimeline,
            'playlist_id' => $this->playlist_id,
            'playlist_order' => $this->playlist_order,
            'image' => $this->image ? ImageResource::make($this->image) : null,
            'search_by' => '',
        ];
    }
}
