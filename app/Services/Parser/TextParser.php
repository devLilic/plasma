<?php

namespace App\Services\Parser;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TextParser implements ParserInterface
{
    use Fragmentize;

    public $code;

    private $default_end_tag;

    public function parse($code)
    {
        $this->code = $code;

        $end_tags = ['<FONT 000000 SIZE=-2>', '<FONT  SIZE=-2>'];

        foreach ($end_tags as $tag) {
            if (strpos($this->code, $tag)) {
                $this->default_end_tag = $tag;
                break;
            }
        }

        return $this;
    }

    public function get_title_for($slugs, ?string $fallback = null)
    {
        $contentSlugs = collect($slugs)
            ->reject(fn ($slug) => preg_match('/-(?:INTRO|INTO)$/i', $slug))
            ->sortBy(function ($slug) {
                foreach (['-BETA', '-FAKE', '-OFF', '-SNC'] as $priority => $suffix) {
                    if (str_ends_with(strtoupper($slug), $suffix)) {
                        return $priority;
                    }
                }

                return 99;
            });

        $sections = $contentSlugs->map(function ($slug) {
            $html = $this->fragment($this->code, '<a name='.$slug.'>', $this->default_end_tag);

            return $this->paragraphsFrom($html);
        });

        foreach ($sections as $paragraphs) {
            $title = $this->extractExplicitTitleFrom($paragraphs, $fallback);

            if ($title !== null) {
                return mb_substr($title, 0, 100);
            }
        }

        foreach ($sections as $paragraphs) {
            $title = $this->extractImplicitTitleFrom($paragraphs, $fallback);

            if ($title !== null) {
                return mb_substr($title, 0, 100);
            }
        }

        return mb_substr(trim($fallback ?? ''), 0, 100);
    }

    public function get_content_for($slugs)
    {
        $sections = $this->get_sections_for($slugs);
        $intro = collect($sections)->firstWhere('type', 'INTRO') ?: collect($sections)->first();

        return implode("\n\n", $intro['paragraphs'] ?? []);
    }

    /** @return array<int, array{slug: string, type: string, paragraphs: array<int, string>}> */
    public function get_sections_for($slugs): array
    {
        return collect($slugs)->map(function ($slug) {
            $html = $this->fragment($this->code, '<a name='.$slug.'>', $this->default_end_tag);

            return [
                'slug' => $slug,
                'type' => $this->sectionType($slug),
                'paragraphs' => $this->paragraphsFrom($html)->all(),
            ];
        })->values()->all();
    }

    /** @return Collection<int, string> */
    private function paragraphsFrom(string $html): Collection
    {
        preg_match_all('/<p\b[^>]*>(.*?)(?=<p\b|$)/is', $html, $matches);

        return collect($matches[1] ?? [])
            ->map(fn ($paragraph) => trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($paragraph)))))
            ->filter()
            ->values();
    }

    private function sectionType(string $slug): string
    {
        $slug = Str::upper(trim($slug));
        if (str_starts_with($slug, 'TEASE')) {
            return 'TEASE';
        }

        $type = str_contains($slug, '-') ? trim(Str::afterLast($slug, '-')) : 'TEXT';

        return $type === 'INTO' ? 'INTRO' : $type;
    }

    /** @param  Collection<int, string>  $paragraphs */
    private function extractExplicitTitleFrom(Collection $paragraphs, ?string $fallback): ?string
    {
        foreach ($paragraphs as $index => $paragraph) {
            if (! preg_match('/^TITLU\s*:?\s*(.*)$/iu', $paragraph, $matches)) {
                continue;
            }

            $inlineTitle = $this->sanitizeTitle($matches[1]);
            if ($this->isUsableTitle($inlineTitle, $fallback)) {
                return mb_strtoupper($inlineTitle);
            }

            $nextParagraph = $this->sanitizeTitle($paragraphs->get($index + 1, ''));
            if ($this->isUsableTitle($nextParagraph, $fallback)) {
                return mb_strtoupper($nextParagraph);
            }
        }

        return null;
    }

    /** @param  Collection<int, string>  $paragraphs */
    private function extractImplicitTitleFrom(Collection $paragraphs, ?string $fallback): ?string
    {
        foreach ($paragraphs as $paragraph) {
            $paragraph = $this->sanitizeTitle($paragraph);

            if ($this->isSectionMarker($paragraph)) {
                return null;
            }

            if ($this->isUsableTitle($paragraph, $fallback)) {
                return mb_strtoupper($paragraph);
            }
        }

        return null;
    }

    private function isUsableTitle(string $value, ?string $fallback): bool
    {
        $value = trim($value);
        if ($value === ''
            || preg_match('/^[\p{P}\p{S}\s]+$/u', $value)
            || preg_match('/^\d+(?:[.,:\/\-]\d+)*$/u', $value)
            || preg_match('/^(MD|RO)\s+/iu', $value)
            || $this->isSectionMarker($value)) {
            return false;
        }

        if ($fallback !== null && $this->normalizeIdentifier($value) === $this->normalizeIdentifier($fallback)) {
            return false;
        }

        return mb_strlen($value) <= 180;
    }

    private function sanitizeTitle(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/\s*\?{2,}\s*$/u', '', $value);

        return trim($value);
    }

    private function isSectionMarker(string $value): bool
    {
        return (bool) preg_match('/^(INTRO|BETA|FAKE|OFF|SNC|SINCRON|TEXT)\s*:?$/iu', trim($value));
    }

    private function normalizeIdentifier(string $value): string
    {
        $value = Str::ascii(Str::upper($value));
        $value = preg_replace('/^(MD|RO)\s+/', '', $value);
        $value = preg_replace('/\b(OFF|BETA|FAKE|SNC|INTRO|AJUSTAT|\d+)\b/', ' ', $value);

        return trim(preg_replace('/\s+/', ' ', $value));
    }

    public function getTitle()
    {
        if (strlen($this->code) > 10) {
            $rows = explode("\r\n", $this->code);
            $title_1 = preg_replace('/TITLU:/', '', $rows[0]);
            $title_2 = preg_replace('/TITLU:/', '', $rows[1]);

            return strlen($title_1) < strlen($title_2) ? $title_1 : $title_2;
        }

        return '';
    }
}
