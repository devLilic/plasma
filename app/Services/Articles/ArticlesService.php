<?php

namespace App\Services\Articles;

use Facades\App\Services\Parser\ListParser;
use Facades\App\Services\Parser\TextParser;

class ArticlesService
{
    protected array $articles = [];

    protected string $html;

    public function all(): array
    {
        return $this->articles;
    }

    public function generate($htmlCode): array
    {
        $this->articles = [];
        $this->html = $htmlCode;
        $entries = ListParser::parse($this->html)->entries();

        foreach ($entries as $entry) {
            $article = new Article($entry['search'], $entry['slugs'], $entry['technical_title']);
            $article->title = TextParser::parse($this->html)->get_title_for($article->slugs, $article->search_slug);
            $article->content = TextParser::parse($this->html)->get_content_for($article->slugs);
            $article->sections = TextParser::parse($this->html)->get_sections_for($article->slugs);
            $article->classify();
            $this->articles[] = $article;
        }

        //        dd($this->articles);
        return $this->articles;
    }
}
