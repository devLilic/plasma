<?php

namespace App\Services\Playlists;

use App\Services\Articles\Article;
use App\Services\Enps\EnpsBasicContent;
use App\Services\Enps\EnpsWebException;

/** Maps ENPS records directly into the same structured articles as the HTM parser. */
class EnpsPlaylistAdapter
{
    private const SEGMENTS = 'INTRO|INTO|BETA|OFF|LIVE|SNC|SINCRON|AMB|TEASE|FAKE|TEXT';

    public function __construct(private readonly PlaylistTitleExclusions $exclusions) {}

    /** @return array<int, Article> */
    public function articles(array $payload): array
    {
        if (! is_array($payload['CollectionScripts'] ?? null)) {
            throw new EnpsWebException('invalid_response', 'Răspunsul ENPS nu conține CollectionScripts.', 422);
        }
        $scripts = $payload['CollectionScripts'];
        foreach ($scripts as $script) {
            if (! is_array($script)) {
                throw new EnpsWebException('invalid_response', 'ENPS a returnat un script invalid.', 422);
            }
        }
        usort($scripts, fn ($a, $b) => (int) ($a['ScriptOrder'] ?? 0) <=> (int) ($b['ScriptOrder'] ?? 0));
        $groups = [];
        foreach ($scripts as $script) {
            $data = $script['RecordPointer']['ListData'] ?? null;
            if (! is_array($data)) {
                // Empty ENPS rundown rows are placeholders, not a reason to reject
                // the other valid stories in the playlist.
                continue;
            }
            $slug = trim((string) ($data['Title'] ?? ''));
            if ($slug === '') {
                continue;
            }
            $beginText = $data['BeginText'] ?? '';
            if (! is_string($beginText)) {
                throw new EnpsWebException('invalid_response', 'Textul unui script ENPS are un format invalid.', 422);
            }
            $name = $slug;
            $segment = 'TEXT';
            $segmentPattern = '(?:'.self::SEGMENTS.')';
            if (preg_match('/-('.$segmentPattern.'(?:[ -]+'.$segmentPattern.')*)\s*$/iu', $slug, $matches, PREG_OFFSET_CAPTURE)) {
                preg_match_all('/'.self::SEGMENTS.'/iu', $matches[1][0], $suffixes);
                $suffixes = array_map('strtoupper', $suffixes[0]);
                // Compound labels such as "-AMB OFF" describe the OFF item in
                // Plasma; AMB is an ENPS production cue, not another article.
                $segment = in_array('OFF', $suffixes, true) ? 'OFF' : end($suffixes);
                $segment = $segment === 'INTO' ? 'INTRO' : $segment;
                $name = trim(substr($slug, 0, $matches[0][1]));
            } elseif (preg_match('/^TEASE\b/iu', $name)) {
                $segment = 'TEASE';
            }
            $index = array_key_last($groups);
            if ($index === null || mb_strtoupper($groups[$index]['name']) !== mb_strtoupper($name)) {
                $groups[] = ['name' => $name, 'records' => []];
                $index = array_key_last($groups);
            }
            $groups[$index]['records'][] = [
                'slug' => $slug,
                'segment' => $segment,
                'text' => $this->completeText($beginText, $segment, $script['BasicContent'] ?? []),
                'mosObjects' => EnpsBasicContent::mosObjects($script['BasicContent'] ?? []),
                'hasContent' => is_bool($script['_PlasmaHasContent'] ?? null)
                    ? $script['_PlasmaHasContent']
                    : self::scriptHasContent($script),
                'approved' => is_bool($script['_PlasmaApproved'] ?? null)
                    ? $script['_PlasmaApproved']
                    : self::scriptApproved($script),
            ];
        }

        $articles = [];
        foreach ($groups as $group) {
            $search = preg_replace('/^(MD|RO)\s+/iu', '', $group['name']);
            $search = trim(preg_replace('/\s+(OFF|BETA|SNC)$/iu', '', $search));
            $article = new Article($search, array_column($group['records'], 'slug'), $group['name']);
            $article->title = mb_substr($group['name'], 0, 100);
            $segments = [];
            $parsed = [];
            $mosObjects = [];
            $hasIntroSource = collect($group['records'])->contains(fn ($record) => $record['segment'] === 'INTRO'
                && collect($this->sections($record['text']))->contains(fn ($section) => $section['type'] === 'INTRO' && $section['paragraphs'] !== []));
            foreach ($group['records'] as $record) {
                $segments[] = $record['segment'];
                foreach ($record['mosObjects'] as $object) {
                    // Shared commands in consecutive segments appear once per story.
                    $mosObjects[json_encode($object, JSON_THROW_ON_ERROR)] = $object;
                }
                $text = $this->text($record['text']);
                if (preg_match('/(?:^|\n)\s*(?:TITLU|TITLE)\s*:\s*([^\n]+)/iu', $text, $title)) {
                    $article->title = mb_substr(mb_strtoupper(trim($title[1])), 0, 100);
                }
                $parts = $this->sections($text);
                foreach ($parts as $part) {
                    if ($part['type'] === 'INTRO' && $hasIntroSource && $record['segment'] !== 'INTRO') {
                        continue;
                    }
                    if ($part['paragraphs'] === []) {
                        continue;
                    }
                    $parsed[$part['type']] ??= ['type' => $part['type'], 'slug' => $record['slug'], 'paragraphs' => [], 'seen' => []];
                    foreach ($part['paragraphs'] as $paragraph) {
                        $fingerprint = mb_strtolower(preg_replace('/\s+/u', ' ', trim($paragraph)) ?? '');
                        if ($fingerprint === '' || isset($parsed[$part['type']]['seen'][$fingerprint])) {
                            continue;
                        }
                        $parsed[$part['type']]['seen'][$fingerprint] = true;
                        $parsed[$part['type']]['paragraphs'][] = $paragraph;
                    }
                }
            }
            $segments = array_values(array_unique($segments));
            $article->sections = array_map(fn ($section) => [
                'type' => $section['type'],
                'slug' => $section['slug'],
                'paragraphs' => $section['paragraphs'],
            ], array_values(array_filter($parsed, fn ($section) => $section['paragraphs'] !== [])));
            $intro = collect($article->sections)->firstWhere('type', 'INTRO');
            $article->content = implode("\n\n", $intro['paragraphs'] ?? []);
            $article->classify();
            $article->types = $segments;
            $article->mos_objects = array_values($mosObjects);
            $contentRecords = array_values(array_filter($group['records'], fn ($record) => $record['hasContent']));
            $article->enps_marker_color = $contentRecords === []
                ? 'yellow'
                : (collect($contentRecords)->every(fn ($record) => $record['approved'] === true) ? 'green' : 'red');
            $articles[] = $article;
        }

        if ($articles === []) {
            throw new EnpsWebException('invalid_response', 'Playlistul ENPS nu conține articole care pot fi importate.', 422);
        }

        $excludedTitles = $this->exclusions->terms();

        return array_values(array_filter($articles, function (Article $article) use ($excludedTitles) {
            $technicalTitle = mb_strtoupper($article->technical_title);

            return ! collect($excludedTitles)->contains(fn ($term) => str_contains($technicalTitle, $term));
        }));
    }

    /** Detect text or linked media which makes an ENPS rundown row non-empty. */
    public static function scriptHasContent(array $script): bool
    {
        $pointer = $script['RecordPointer'] ?? [];
        $listData = $pointer['ListData'] ?? [];
        if (self::hasText($listData['BeginText'] ?? null)) {
            return true;
        }
        foreach (($pointer['ObjectProperties'] ?? []) as $property) {
            if (is_array($property)
                && mb_strtolower((string) ($property['FieldName'] ?? '')) === 'text'
                && self::hasText($property['FieldValue'] ?? null)) {
                return true;
            }
        }

        return self::hasLinkedContent($pointer['LinkedRecords'] ?? null)
            || self::hasLinkedContent($pointer['ObjectLinks']['LinkedRecords'] ?? null);
    }

    /** Read Approved from either the flattened ListData or ObjectProperties representation. */
    public static function scriptApproved(array $script): ?bool
    {
        $pointer = $script['RecordPointer'] ?? [];
        $listData = $pointer['ListData'] ?? [];
        if (array_key_exists('Approved', $listData)) {
            return self::booleanValue($listData['Approved']);
        }
        foreach (($pointer['ObjectProperties'] ?? []) as $property) {
            if (is_array($property) && mb_strtolower((string) ($property['FieldName'] ?? '')) === 'approved') {
                return self::booleanValue($property['FieldValue'] ?? null);
            }
        }

        return null;
    }

    private static function hasText(mixed $value): bool
    {
        return is_string($value) && trim(strip_tags($value)) !== '';
    }

    private static function hasLinkedContent(mixed $links): bool
    {
        if (! is_array($links) || $links === []) {
            return false;
        }
        if (array_key_exists('$values', $links)) {
            return self::hasLinkedContent($links['$values']);
        }

        return array_is_list($links)
            ? $links !== []
            : collect($links)->contains(fn ($value) => self::hasLinkedContent($value));
    }

    private static function booleanValue(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }
        $normalized = is_string($value) ? mb_strtolower(trim($value)) : $value;
        if ($normalized === 1 || $normalized === '1' || $normalized === 'true') {
            return true;
        }
        if ($normalized === 0 || $normalized === '0' || $normalized === 'false') {
            return false;
        }

        return null;
    }

    private function text(string $text): string
    {
        $text = str_replace(['\\r\\n', '\\n', '\\r', "\r\n", "\r"], "\n", $text);
        $text = preg_replace('/<br\s*\/?\s*>|<\/p>/iu', "\n", $text);

        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace(["\u{00A0}", "\u{202F}", "\u{2007}"], ' ', $text);
        $text = str_replace(["\u{00AD}", "\u{200B}", "\u{FEFF}"], '', $text);
        $text = str_replace(["\u{2028}", "\u{2029}"], "\n", $text);

        return trim($text);
    }

    private function completeText(string $beginText, string $segment, array $basicContent): string
    {
        if ($segment === 'INTRO' || $beginText === '' || $basicContent === []) {
            return $beginText;
        }
        $fullText = $this->text(EnpsBasicContent::editorialText($basicContent));
        $preview = preg_replace('/\s+/u', ' ', $this->text($beginText)) ?? '';
        $full = preg_replace('/\s+/u', ' ', $fullText) ?? '';
        // BeginText is a capped preview. Accept only a verified continuation,
        // never unrelated/stale BasicContent or its own capped BeginText.
        return $preview !== '' && strlen($full) > strlen($preview) && str_starts_with($full, $preview)
            ? $fullText : $beginText;
    }

    /** Remove production tokens, retaining speech before/after them and later lines. */
    public function cleanSpeech(string $text): string
    {
        $lines = $this->editorialLines(explode("\n", $this->text($text)));

        return implode("\n", array_filter($lines, fn ($line) => $line !== '' && ! $this->isTechnicalMetadata($line)));
    }

    private function editorialLines(array $lines): array
    {
        $result = [];
        $quoteContext = false;
        $time = '(?:\d{1,2}[:.]\d{2}(?::\d{2}(?:[.,]\d+)?)?|\d{1,2}[ \t]+\d{2})';
        foreach ($lines as $index => $line) {
            $line = trim($line);
            $cue = preg_match('/^(?:STAND[ \t]*UP|BRUT|VOXURI|AMBIAN[ȚT][ĂA])\b/u', $line);
            if ($cue) {
                $quoteContext = true;
                $result[] = '';
                continue;
            }
            if (preg_match('/^(?:SINCRON|SNC|PRIN[ \t]+TELEFON)\b/iu', $line)) {
                $quoteContext = true;
                $result[] = $line;
                continue;
            }
            $next = '';
            for ($nextIndex = $index + 1; $nextIndex < count($lines); $nextIndex++) {
                if (($next = trim($lines[$nextIndex])) !== '') {
                    break;
                }
            }
            if ($quoteContext && preg_match('/^\d{3,}(?:[ \t]+.+)?$/u', $line)
                && preg_match('/^(?:T\.?C\.?|'.$time.')(?:[ \t]|$)/iu', $next)) {
                $result[] = '';
                continue;
            }
            $keepPunctuation = fn ($match) => preg_match('/[.,;:!?)\]]+$/u', $match[0], $punctuation) ? $punctuation[0] : '';
            $line = preg_replace_callback('~(?:https?|ftp)://[^\s<>]+~iu', $keepPunctuation, $line);
            $line = preg_replace_callback('~(?<!\S)(?:"(?:\\\\\\\\|[a-z]:[\\\\/])[^"\r\n]+"|(?:\\\\\\\\|//|[a-z]:[\\\\/])\S+)~iu', $keepPunctuation, $line);
            $line = preg_replace('/[([][ \t]*[)\]]/u', '', $line);
            $line = preg_replace('/^(?:T\.?[ \t]*C\.?|TIMECODE)[ \t]*:?[ \t]*'.$time.'(?:[ \t]*(?:[-–][ \t]*'.$time.'|mu[șs]c[ăa][ \t]*'.$time.'(?:[ \t]*[-–][ \t]*'.$time.')?))*[ \t]*/iu', '', $line, count: $explicitTime);
            $timedQuote = $explicitTime > 0;
            if ($quoteContext && preg_match('/^'.$time.'[ \t]+/u', $line)) {
                $line = preg_replace('/^'.$time.'[ \t]+/u', '', $line);
                $timedQuote = true;
            }
            if ($timedQuote) {
                $line = preg_replace('/[ \t]+'.$time.'([.!?]?)$/u', '$1', $line);
            }
            $line = trim(preg_replace('/[ \t]+/u', ' ', $line));
            $result[] = $line;
            if ($line !== '' && ! $this->isTechnicalMetadata($line)) {
                $quoteContext = false;
            }
        }

        return $result;
    }

    private function sections(string $text): array
    {
        $text = $this->text($text);
        $lines = $this->editorialLines(explode("\n", $text));
        foreach ($lines as $index => $line) {
            $marker = $this->sectionMarker(trim($line));
            if ($marker !== null) {
                // Discard a technical preamble only before an explicit INTRO.
                // Text preceding OFF/BETA is the unmarked intro and must survive.
                if ($marker['type'] === 'INTRO') {
                    $lines = array_slice($lines, $index);
                }
                break;
            }
        }
        $sections = [];
        $type = 'INTRO';
        $paragraphs = [];
        $buffer = [];
        $flush = function () use (&$buffer, &$paragraphs): void {
            if ($buffer !== []) {
                $paragraphs[] = implode(' ', $buffer);
                $buffer = [];
            }
        };
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || preg_match('/^(?:TITLU|TITLE)\s*:/iu', $line) || $this->isTechnicalMetadata($line)) {
                $flush();
                continue;
            }
            $marker = $this->sectionMarker($line);
            if ($marker !== null) {
                $flush();
                if ($paragraphs !== []) {
                    $sections[] = ['type' => $type, 'paragraphs' => $paragraphs];
                }
                $type = $marker['type'];
                $paragraphs = [];
                $buffer = $marker['text'] !== '' ? [$marker['text']] : [];
            } else {
                $buffer[] = $line;
            }
        }
        $flush();
        if ($paragraphs !== []) {
            $sections[] = ['type' => $type, 'paragraphs' => $paragraphs];
        }

        return $sections;
    }

    private function sectionMarker(string $line): ?array
    {
        if (! preg_match('/^('.self::SEGMENTS.')[ \t]*(?::[ \t]*(.*)|$)/iu', $line, $match)
            && ! preg_match('/^('.self::SEGMENTS.')[ \t]+(.+)$/u', $line, $match)) {
            return null;
        }
        $type = mb_strtoupper($match[1]);

        return ['type' => $type === 'INTO' ? 'INTRO' : $type, 'text' => trim($match[2] ?? '')];
    }

    private function isTechnicalMetadata(string $line): bool
    {
        $isFilePath = str_starts_with($line, '\\\\')
            || str_starts_with($line, '//')
            || (strlen($line) >= 3 && ctype_alpha($line[0]) && $line[1] === ':' && in_array($line[2], ['\\', '/'], true));

        return $isFilePath
            || preg_match('/^(?:MD|RO)\s+.+$/iu', $line)
            || preg_match('/^\d{3,}[_-]\d{2,}$/u', $line)
            || preg_match('/^(?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d+)?(?:\s*[-–]\s*(?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d+)?)?$/u', $line)
            || preg_match('/^[.\s]+$/u', $line);
    }
}
