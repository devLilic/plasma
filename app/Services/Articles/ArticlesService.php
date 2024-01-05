<?php

namespace App\Services\Articles;

use Facades\App\Services\Parser\TextParser;
use Facades\App\Services\Parser\ListParser;

class ArticlesService {

    protected array $articles = [];
    protected string $html;

    public function all(): array
    {
        return $this->articles;
    }

    public function generate($htmlCode): array
    {
        $this->html = $htmlCode;
        $titles = ListParser::parse($this->html)->get();

        foreach ($titles as $search => $slugs) {
            $article = new Article($search, $slugs);
            $article->title = TextParser::parse($this->html)->get_title_for($article->slugs);
            $article->content = TextParser::parse($this->html)->get_content_for($article->slugs);
            $this->articles[] = $article;
        }
//        dd($this->articles);
        return $this->articles;
    }
}
