<?php

namespace App\Services\Articles;

class Article
{
    public array $slugs; // Technical title, used internally for identifying the articles;

    public string $search_slug; // article slug, can be used for search

    public string $title; // Public title. Get it from the BETA/OFF part of the text

    public string $content;

    public string $technical_title;

    /** @var array<int, array{slug: string, type: string, paragraphs: array<int, string>}> */
    public array $sections = [];

    /** @var array<int, string> */
    public array $types = [];

    public string $type;

    public string $other_title = '';

    public string $search_by = 'slug';

    public function __construct($search, $slugs, ?string $technicalTitle = null)
    {
        $this->search_slug = $search;
        $this->slugs = $slugs;
        $this->technical_title = $technicalTitle ?: $search;
    }

    public function classify(): void
    {
        $title = mb_strtoupper($this->technical_title);
        $sectionTypes = collect($this->sections)->pluck('type')->map(fn ($type) => mb_strtoupper($type));
        $slugs = collect($this->slugs)->map(fn ($slug) => mb_strtoupper($slug));
        $types = collect();

        if (preg_match('/\b(?:HEADLINES?|HEADER)\b/u', $title)) {
            $types->push('HEADER');
        }
        if (preg_match('/^TEASE\b/u', $title)) {
            $types->push('TEASE');
        }
        if (preg_match('/\bMETEO\b/u', $title)) {
            $types->push('METEO');
        }
        if (preg_match('/\bCURS(?:\s+VALUTAR)?\b/u', $title)) {
            $types->push('CURS');
        }
        if (preg_match('/\bLIVE\b/u', $title)) {
            $types->push('LIVE');
        }
        if (preg_match('/\bFAKE\b/u', $title)
            || $sectionTypes->contains('FAKE')
            || $slugs->contains(fn ($slug) => preg_match('/(?:^|-)FAKE(?:-|$)/u', $slug))) {
            $types->push('FAKE');
        }
        if ($sectionTypes->contains(fn ($type) => $type === 'OFF' || str_ends_with($type, ' OFF'))
            || $slugs->contains(fn ($slug) => preg_match('/(?:^|-)OFF(?:-|$)/u', $slug))) {
            $types->push('OFF');
        }
        if ($sectionTypes->contains('BETA')
            || $slugs->contains(fn ($slug) => preg_match('/(?:^|-)BETA(?:-|$)/u', $slug))) {
            $types->push('BETA');
        }

        $this->types = $types->unique()->values()->all();
        if ($this->types === []) {
            $this->types = ['BETA'];
        }

        $this->type = in_array('OFF', $this->types, true)
            ? 'OFF'
            : (in_array('BETA', $this->types, true) ? 'BETA' : $this->types[0]);
    }
}
