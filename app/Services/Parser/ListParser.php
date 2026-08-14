<?php

namespace App\Services\Parser;

use App\Services\Playlists\PlaylistTitleExclusions;
use Illuminate\Support\Str;

class ListParser implements ParserInterface
{
    use Fragmentize;

    protected $titles = [];

    protected array $restrictedTitles = [];

    public function __construct(private readonly PlaylistTitleExclusions $titleExclusions) {}

    public function parse($html)
    {
        $this->titles = [];
        $this->restrictedTitles = $this->titleExclusions->terms();

        // get all LI tags as one fragment of text
        $li_html = $this->fragment($html, '<UL>', '</UL>');

        // remove tags and transform to a list of titles
        $list_items = collect(preg_split('/\R/u', strip_tags($li_html)) ?: [])
            ->map(fn ($item) => trim($item))
            ->filter();

        // remove titles that are disabled in the import settings
        $list_items = $list_items->filter(fn ($item) => ! $this->is_restricted($item));

        foreach ($list_items as $item) {
            if ($this->isTease($item)) {
                $this->titles[$this->clean($item)] = [$item];

                continue;
            }

            if ($this->isIntro($item)) {
                $intro = $this->clean($item);
                $stem = $this->articleStem($item);
                $parts = $list_items
                    ->filter(fn ($part) => str_starts_with($this->normalizedListItem($part), $stem.'-'))
                    ->values()
                    ->toArray();
                $this->titles[$intro] = $parts;

                continue;
            }
        }

        return $this;
    }

    public function get()
    {
        return $this->titles;
    }

    public function clean($title): string
    {
        $title = $this->normalizedListItem($title);
        $title = preg_replace('/^(?:MD|RO)\s+/iu', '', $title);
        $title = preg_replace('/-(?:INTRO|INTO|BETA|FAKE|OFF|SNC)(?:-(?:OFF|SNC))*$/iu', '', $title);
        $title = preg_replace('/\s+(?:OFF|BETA|SNC)$/iu', '', $title);
        $title = preg_replace('/\bDUPLEX\b/iu', '', $title);

        return trim(preg_replace('/\s+/u', ' ', $title));
    }

    private function articleStem(string $intro): string
    {
        return preg_replace('/-(?:INTRO|INTO)$/iu', '', $this->normalizedListItem($intro));
    }

    private function isIntro(string $item): bool
    {
        return (bool) preg_match('/-(?:INTRO|INTO)\s*$/iu', $item);
    }

    private function isTease(string $item): bool
    {
        return (bool) preg_match('/^TEASE(?:\s|-)/iu', $item);
    }

    private function normalizedListItem(string $item): string
    {
        return Str::upper(trim(preg_replace('/\s+/u', ' ', $item)));
    }

    /**
     * @param  bool  $accepted
     */
    protected function is_restricted($item): bool
    {
        return Str::contains(Str::upper($item), $this->restrictedTitles);
    }
}
