<?php

namespace App\Services\Playlists;

use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Services\Images\ImageMatcher;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class PlaylistImporter
{
    public function previousArticles(): Collection
    {
        return Playlist::latest()->take(2)->with('articles')->get()
            ->flatMap(fn ($playlist) => $playlist->articles)->unique('subtitle');
    }

    /**
     * @param  array<int, \App\Services\Articles\Article>  $parsedArticles
     * @param  Collection<int, Article>  $imageCandidates
     */
    public function synchronizeArticles(
        Playlist $playlist,
        array $parsedArticles,
        Collection $imageCandidates,
        ImageMatcher $imageMatcher,
        bool $removeMissing = false,
    ): void {
        $availableArticles = $playlist->articles()->get()->keyBy('id');
        $reservedArticleIds = collect($parsedArticles)
            ->map(fn ($parsedArticle) => $availableArticles
                ->first(fn (Article $article) => $article->subtitle === $parsedArticle->search_slug)?->id)
            ->filter()
            ->unique();
        $retainedIds = [];

        foreach ($parsedArticles as $order => $parsedArticle) {
            $article = $this->matchingArticle(
                $availableArticles,
                $parsedArticle->search_slug,
                $parsedArticle->slugs,
                $reservedArticleIds,
            );
            $imageId = $article?->image_id
                ?: $this->findImage($imageCandidates, $parsedArticle->search_slug, $parsedArticle->title, $imageMatcher);
            $attributes = [
                'title' => $parsedArticle->title,
                'subtitle' => $parsedArticle->search_slug,
                'technical_title' => $parsedArticle->technical_title,
                'slugs' => Arr::join($parsedArticle->slugs, '||'),
                'intro' => $parsedArticle->content,
                'content_sections' => $parsedArticle->sections,
                'article_type' => $parsedArticle->type,
                'article_types' => $parsedArticle->types,
                'enps_marker_color' => $parsedArticle->enps_marker_color,
                'mos_objects' => $parsedArticle->mos_objects,
                'playlist_order' => $order + 1,
                'image_id' => $imageId ?: null,
            ];

            if ($article) {
                $article->update($attributes);
                $availableArticles->forget($article->id);
            } else {
                $article = $playlist->articles()->create($attributes);
            }

            $retainedIds[] = $article->id;
            if ($imageId) {
                Image::whereKey($imageId)->update(['last_used_at' => now()]);
            }
        }

        if ($removeMissing) {
            $playlist->articles()->whereNotIn('id', $retainedIds)->delete();
        }
    }

    /** @param  array<int, string>  $slugs */
    private function matchingArticle(
        Collection $articles,
        string $subtitle,
        array $slugs,
        Collection $reservedArticleIds,
    ): ?Article {
        $exactMatch = $articles->first(fn (Article $article) => $article->subtitle === $subtitle);
        if ($exactMatch) {
            return $exactMatch;
        }

        return $articles->first(function (Article $article) use ($slugs, $reservedArticleIds) {
            if ($reservedArticleIds->contains($article->id)) {
                return false;
            }

            $storedSlugs = explode('||', (string) $article->slugs);

            return count(array_intersect($storedSlugs, $slugs)) > 0;
        });
    }

    private function findImage($previous_articles, string $slug, string $title, ImageMatcher $imageMatcher)
    {
        $found_article = $previous_articles
            ->where('subtitle', $slug)
            ->first(fn ($article) => $article->image_id !== null);
        if ($found_article) {
            return $found_article->image_id;
        }

        $normalizedSlug = collect(explode(' ', trim($slug)))
            ->filter(fn ($word) => ! (int) $word && strlen($word) > 2)
            ->implode(' ');
        $found_article = $previous_articles
            ->where('subtitle', $normalizedSlug)
            ->first(fn ($article) => $article->image_id !== null);
        if ($found_article) {
            return $found_article->image_id;
        }

        return $imageMatcher->bestMatch([$title, $slug])?->id;
    }
}
