<?php

namespace App\Services\Articles;

use App\Models\Article;
use App\Models\ArticleMosSequenceOrder;
use Illuminate\Support\Facades\DB;

class ArticleMosSequenceOrderService
{
    /** @return array{entryOrder: array, entryZones: array} */
    public function forArticle(Article $article): array
    {
        $saved = ArticleMosSequenceOrder::query()->where('article_id', $article->id)->first();

        return [
            'entryOrder' => $saved?->entry_order ?? [],
            'entryZones' => $saved?->entry_zones ?? [],
        ];
    }

    /** @return array{entryOrder: array, entryZones: array} */
    public function save(Article $article, array $entryOrder, array $entryZones): array
    {
        return DB::transaction(function () use ($article, $entryOrder, $entryZones) {
            Article::query()->whereKey($article->id)->lockForUpdate()->firstOrFail();
            $saved = ArticleMosSequenceOrder::query()->updateOrCreate(
                ['article_id' => $article->id],
                ['entry_order' => array_values($entryOrder), 'entry_zones' => $entryZones],
            );

            return [
                'entryOrder' => $saved->entry_order ?? [],
                'entryZones' => $saved->entry_zones ?? [],
            ];
        });
    }
}
