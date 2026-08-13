<?php

namespace App\Services\Images;

use App\Models\Image;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ImageMatcher
{
    /**
     * Return the most relevant image for the supplied editorial terms.
     */
    public function bestMatch(array $terms): ?Image
    {
        return $this->rank(Image::with('tags')->get(), $terms)
            ->first(fn (Image $image) => $this->score($image, $terms) > 0);
    }

    /**
     * Put images with matching tags first, then preserve recency.
     *
     * @param  Collection<int, Image>  $images
     * @return Collection<int, Image>
     */
    public function rank(Collection $images, array $terms): Collection
    {
        return $images->sort(function (Image $left, Image $right) use ($terms) {
            $scoreDifference = $this->score($right, $terms) <=> $this->score($left, $terms);
            if ($scoreDifference !== 0) {
                return $scoreDifference;
            }

            return ($right->updated_at?->getTimestamp() ?? $right->id)
                <=> ($left->updated_at?->getTimestamp() ?? $left->id);
        })->values();
    }

    public function score(Image $image, array $terms): int
    {
        $normalizedTerms = collect($terms)
            ->map(fn ($term) => $this->normalize((string) $term))
            ->filter()
            ->values();
        $termTokens = $normalizedTerms
            ->flatMap(fn ($term) => $this->tokens($term))
            ->unique()
            ->values();

        return $image->tags->sum(function ($tag) use ($normalizedTerms, $termTokens) {
            $normalizedTag = $this->normalize($tag->title);
            if ($normalizedTag === '') {
                return 0;
            }

            $tagTokens = $this->tokens($normalizedTag);
            $commonWords = $tagTokens->intersect($termTokens)->count();
            $phraseMatch = $normalizedTerms->contains(
                fn ($term) => str_contains($term, $normalizedTag) || str_contains($normalizedTag, $term)
            );

            return ($phraseMatch ? 100 + ($tagTokens->count() * 10) : 0) + ($commonWords * 10);
        });
    }

    private function normalize(string $value): string
    {
        $value = Str::ascii(Str::lower($value));

        return trim(preg_replace('/[^a-z0-9]+/', ' ', $value));
    }

    /** @return Collection<int, string> */
    private function tokens(string $value): Collection
    {
        return collect(explode(' ', $value))
            ->filter(fn ($word) => strlen($word) > 2 && ! in_array($word, ['beta', 'fake', 'intro', 'off', 'snc'], true))
            ->unique()
            ->values();
    }
}
