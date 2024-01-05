<?php

namespace App\Services\Parser;

use Illuminate\Support\Str;

class ListParser implements ParserInterface {

    use Fragmentize;

    protected $titles = [];

    public function parse($html)
    {
        // get all LI tags as one fragment of text
        $li_html = $this->fragment($html, "<UL>", "</UL>");

        // remove tags and transform to a list of titles
        $list_items = collect(explode("\r\n", strip_tags($li_html)));

        // remove unnecessary titles like GENERIC, TEASE...
        $list_items = $list_items->filter(fn ($item) => !$this->is_restricted($item));

        // get title for each intro
        $intros = $list_items
            ->filter(fn($title) => preg_match("/INTRO|INTO/", $title))
            ->map(fn($title) => $this->clean($title));

        // based on list of intro titles, find titles of all parts of article
        foreach ($intros as $intro){
            $parts = $list_items->filter(function ($item) use ($intro){
                $intro = Str::of($intro)->replace("+", "\+");
                return preg_match("/$intro/", $item);
            })->values()->toArray();
            $this->titles[$intro] = $parts;
        }

        return $this;
    }

    public function get()
    {
        return $this->titles;
    }

    public function clean($title): string
    {
        $patterns_to_remove = [
            "/^MD\s?/",
            "/^RO\s?/",
            "/-{1}INTRO|BETA$/",
            "/OFF$/",
            "/OFF-SNC$/",
            "/OFF-OFF$/",
            "/DUPLEX/"
        ];
        return trim(preg_replace($patterns_to_remove, "", $title));
    }

    /**
     * @param $item
     * @param bool $accepted
     * @return bool
     */
    protected function is_restricted($item): bool
    {
        $restricted_slugs = [
            'GENERIC  IN',
            'GENERIC IN',
            'HEADLINES-INTRO',
            'HEADLINES-BETA',
            'DUPLEX',
            'PA-INTRO',
            'GENERIC OUT',
            'TEASE',
            'LIVE',
            'METEO',
            'CURS VALUTAR',
            'EXTRO'
        ];

        foreach ($restricted_slugs as $slug) {

            // if itemText contains one of restricted titles
            if (preg_match("/$slug/", $item)) {
                return true;
            }
        }

        return false;
    }

}
