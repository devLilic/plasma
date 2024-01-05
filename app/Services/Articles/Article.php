<?php

namespace App\Services\Articles;

class Article {

    public array $slugs; // Technical title, used internally for identifying the articles;
    public string $search_slug; // article slug, can be used for search
    public string $title; // Public title. Get it from the BETA/OFF part of the text
    public string $content;
    public string $type;
    public string $other_title = "";
    public string $search_by = "slug";

    public function __construct($search, $slugs)
    {
        $this->search_slug = $search;
        $this->slugs = $slugs;
        $this->findType();
    }

    protected function findType(): void
    {
        // if slugs contains OFF then type will be off
        $items = array_filter($this->slugs, fn($slug) => preg_match("/OFF$|OFF-SNC|OFF-OFF/", $slug));
        $this->type = (count($items) > 0) ? "OFF" : "BETA";
    }

}
