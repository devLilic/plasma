<?php

namespace App\Services\Articles;

use App\Models\Article;
use App\Models\PlaylistEnpsItem;
use App\Services\Enps\EnpsBasicContent;
use App\Services\Playlists\EnpsPlaylistAdapter;
use Illuminate\Support\Str;

/** Locate graphics in the script without extracting or moving its speech. */
class ArticleMosTimeline
{
    private ?array $configuredNameGraphicTemplates = null;

    public function __construct(
        private readonly EnpsPlaylistAdapter $adapter,
        private readonly NameGraphicTemplates $nameGraphicTemplates,
    ) {}

    public function forArticle(Article $article, array $objects, array $sections): array
    {
        $slugs = array_values(array_filter(explode('||', $article->slugs ?? '')));
        $sources = $slugs === [] || ! $article->playlist_id ? [] : PlaylistEnpsItem::query()
            ->where('playlist_id', $article->playlist_id)->whereIn('slug', $slugs)
            ->orderBy('position')->get(['basic_content'])->map(fn ($item) => EnpsBasicContent::editorialText($item->basic_content ?? []))
            ->filter(fn ($text) => trim($text) !== '')->unique()->values()->all();
        if ($sources === []) {
            // Saved HTM/manual/older imports remain usable without fetching ENPS.
            $sources = array_map(fn ($section) => $section['type']."\n".implode("\n\n", $section['paragraphs']), $sections);
        }

        $text = implode("\n\n", $sources);

        return $this->completeTimeline($this->scan($text, $objects), $objects, $this->objectsMentionedInVox($text, $objects));
    }

    /** Append source graphics that were not located in the script text. */
    private function completeTimeline(array $events, array $objects, array $voxObjectKeys = []): array
    {
        $graphics = [];
        $located = [];
        foreach ($events as $event) {
            if ($event['kind'] === 'mos') {
                $located[$this->objectKey($event['object'])] = true;
            }
        }
        foreach ($objects as $object) {
            $key = $this->objectKey($object);
            if ($this->isVoxGraphic($object) || isset($voxObjectKeys[$key]) || isset($located[$key])) {
                continue;
            }
            if (array_filter($object['editableObjects'], fn ($field) => trim($field['value']) !== '') !== []) {
                $graphics[$key] ??= $object;
            }
        }

        return [...$events, ...array_map(fn ($object) => ['kind' => 'mos', 'position' => null,
            'sourceLine' => null, 'count' => null, 'object' => $object, 'snippet' => ''], array_values($graphics))];
    }

    private function objectKey(array $object): string
    {
        $titles = [];
        foreach ($object['editableObjects'] as $field) {
            $role = EnpsBasicContent::editableRole($field['name']);
            if (in_array($role, ['title', 'short_title'], true) && trim($field['value']) !== '') {
                $titles[$role][] = $this->normalized($field['value']);
            }
        }
        if ($titles !== []) {
            ksort($titles);

            return 'title:'.json_encode($titles, JSON_THROW_ON_ERROR);
        }

        return 'command:'.$object['commandId'];
    }

    /** Equivalent speaker commands share editable content, but retain their source IDs. */
    private function speakerKey(array $object): ?string
    {
        $fields = [];
        foreach ($object['editableObjects'] ?? [] as $field) {
            if (in_array($this->normalized($field['name'] ?? ''), ['nume', 'name'], true)
                && trim($field['value'] ?? '') !== '') {
                $fields[] = ['name', $this->normalized($field['name']), $this->normalized($field['value'])];
            } elseif (in_array($this->normalized($field['name'] ?? ''), ['functie', 'function'], true)
                && trim($field['value'] ?? '') !== '') {
                $fields[] = ['function', $this->normalized($field['name']), $this->normalized($field['value'])];
            }
        }
        if (! array_filter($fields, fn ($field) => $field[0] === 'name') && $this->isNameGraphic($object)) {
            foreach ($object['editableObjects'] ?? [] as $field) {
                if (trim($field['value'] ?? '') !== '') {
                    $fields[] = ['name', $this->normalized($field['name'] ?? 'Text'), $this->normalized($field['value'])];
                    break;
                }
            }
        }
        if (! array_filter($fields, fn ($field) => $field[0] === 'name')) {
            return null;
        }
        sort($fields);

        return 'speaker:'.json_encode($fields, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    public function scan(string $text, array $objects): array
    {
        $text = str_replace(["\r\n", "\r", "\u{00A0}", "\u{202F}"], ["\n", "\n", ' ', ' '], $text);
        $lines = explode("\n", $text);
        $events = [];
        $seenTitles = [];
        $speakerOccurrences = [];
        $insideVox = false;
        $offset = 0;
        foreach ($lines as $index => $line) {
            $trimmed = trim($line);
            if (preg_match('/^(VOX(?:URI|[- ]URI)?)\b/iu', $trimmed, $vox)) {
                $insideVox = true;
                $count = $this->normalized($vox[1]) === 'vox' ? 1 : null;
                if (preg_match('/^VOX(?:URI|[- ]URI)?[ \t]+[x×][ \t]*(\d+)\b/iu', $trimmed, $number)
                    || preg_match('/^VOX(?:URI|[- ]URI)[ \t]*:?[ \t]+(\d+)\b/iu', $trimmed, $number)) {
                    $count = max(1, (int) $number[1]);
                }
                $events[] = ['kind' => 'vox', 'position' => $offset, 'sourceLine' => $index, 'count' => $count, 'object' => null, 'snippet' => ''];
            } elseif ($this->isVoxBoundary($trimmed)) {
                $insideVox = false;
            }
            if ($insideVox) {
                $offset += strlen($line) + 1;
                continue;
            }
            $isCue = preg_match('/^(?:STAND[ \t]*UP|SINCRON|SNC|PRIN[ \t]+TELEFON)\b/iu', $trimmed) === 1;
            $lineTitleMatches = [];
            foreach ($objects as $object) {
                if ($this->isVoxGraphic($object) || $this->isNameGraphic($object)) {
                    continue;
                }
                foreach ($object['editableObjects'] ?? [] as $field) {
                    if (EnpsBasicContent::editableRole($field['name']) !== 'title' || trim($field['value']) === '') {
                        continue;
                    }
                    $titleMatch = $this->findValue($line, $field['value'], false);
                    if ($titleMatch !== null) {
                        $lineTitleMatches[] = $titleMatch;
                    }
                }
            }
            $speakerCandidates = [];
            foreach ($objects as $object) {
                if ($this->isVoxGraphic($object)) {
                    continue;
                }
                $titles = $this->isNameGraphic($object) ? [] : array_filter($object['editableObjects'], fn ($field) => EnpsBasicContent::editableRole($field['name']) === 'title' && trim($field['value']) !== '');
                $names = array_filter($object['editableObjects'], fn ($field) => in_array($this->normalized($field['name']), ['nume', 'name'], true) && trim($field['value']) !== '');
                if ($names === [] && $this->isNameGraphic($object)) {
                    $names = array_filter($object['editableObjects'], fn ($field) => trim($field['value'] ?? '') !== '');
                    $names = array_slice($names, 0, 1, true);
                }
                foreach ($titles ?: $names as $field) {
                    $match = $this->findValue($line, $field['value'], $titles === []);
                    if ($match === null) {
                        continue;
                    }
                    // A mention in narration is not a speaker attribution.
                    $isBareName = $this->isSpeakerHeading($line, $match, $object);
                    if ($titles === [] && ! $isCue && ! $isBareName && ! $this->isNameGraphic($object)) {
                        continue;
                    }
                    if ($titles === [] && ! $isCue && $this->insideTitleMatch($match, $lineTitleMatches)) {
                        continue;
                    }
                    if ($titles !== []) {
                        // Keep the first occurrence of identical title content, regardless of command ID.
                        $titleKey = $this->objectKey($object);
                        if (isset($seenTitles[$titleKey])) {
                            break;
                        }
                        $seenTitles[$titleKey] = true;
                    } else {
                        $key = $this->speakerKey($object) ?? $this->objectKey($object);
                        $tail = preg_replace('/^[\s,:;–-]+/u', '', substr($line, $match['end']));
                        $functionMatch = false;
                        foreach ($object['editableObjects'] as $field) {
                            if (in_array($this->normalized($field['name']), ['functie', 'function'], true)) {
                                $function = $this->findValue($tail, $field['value'], false);
                                if ($function !== null && $function['start'] === 0) {
                                    $functionMatch = true;
                                    break;
                                }
                            }
                        }
                        $candidate = ['object' => $object, 'match' => $match,
                            'distance' => $match['distance'] ?? 0, 'functionMatch' => $functionMatch];
                        if (! isset($speakerCandidates[$key])
                            || [$candidate['distance'], $candidate['functionMatch'] ? 0 : 1]
                                < [$speakerCandidates[$key]['distance'], $speakerCandidates[$key]['functionMatch'] ? 0 : 1]) {
                            $speakerCandidates[$key] = $candidate;
                        }
                        continue;
                    }
                    $events[] = ['kind' => 'mos', 'position' => $offset + $match['start'], 'sourceLine' => $index, 'count' => null,
                        'object' => $object, 'snippet' => $titles !== [] ? '' : $this->speechStart($lines, $index, $match['end'], $object, $objects)];
                    break;
                }
            }
            if ($speakerCandidates !== []) {
                uasort($speakerCandidates, fn ($left, $right) =>
                    [$left['distance'], $left['functionMatch'] ? 0 : 1]
                    <=> [$right['distance'], $right['functionMatch'] ? 0 : 1]);
                $key = array_key_first($speakerCandidates);
                $equivalentObjects = [];
                foreach ($objects as $object) {
                    if (($this->speakerKey($object) ?? $this->objectKey($object)) === $key) {
                        $equivalentObjects[] = $object;
                    }
                }
                $occurrence = $speakerOccurrences[$key] ?? 0;
                $candidate = $speakerCandidates[$key];
                $object = $equivalentObjects[min($occurrence, count($equivalentObjects) - 1)] ?? $candidate['object'];
                $speakerOccurrences[$key] = $occurrence + 1;
                $name = null;
                foreach ($object['editableObjects'] as $field) {
                    if (in_array($this->normalized($field['name']), ['nume', 'name'], true)) {
                        $name = $this->findValue($line, $field['value'], true);
                        if ($name !== null) {
                            break;
                        }
                    }
                }
                $match = $name ?? $candidate['match'];
                $events[] = ['kind' => 'mos', 'position' => $offset + $match['start'], 'sourceLine' => $index, 'count' => null,
                    'object' => $object, 'snippet' => $this->speechStart($lines, $index, $match['end'], $object, $objects)];
            }
            $offset += strlen($line) + 1;
        }
        usort($events, fn ($a, $b) => $a['position'] <=> $b['position']);
        $grouped = [];
        foreach ($events as $event) {
            $last = array_key_last($grouped);
            if ($event['kind'] === 'vox' && $last !== null && $grouped[$last]['kind'] === 'vox') {
                $between = implode("\n", array_slice($lines, $grouped[$last]['lastLine'] + 1, $event['sourceLine'] - $grouped[$last]['lastLine'] - 1));
                if (! preg_match('/^(?:TEXT|INTRO|BETA|OFF|LIVE|STAND[ \t]*UP|SINCRON|SNC|PRIN[ \t]+TELEFON)\b/imu', $between)) {
                    $grouped[$last]['count'] = $grouped[$last]['count'] === null || $event['count'] === null ? null : $grouped[$last]['count'] + $event['count'];
                    $grouped[$last]['lastLine'] = $event['sourceLine'];
                    continue;
                }
            }
            $grouped[] = [...$event, 'lastLine' => $event['sourceLine']];
        }

        return array_map(fn ($event) => array_diff_key($event, ['lastLine' => true]), $grouped);
    }

    private function insideTitleMatch(array $match, array $titleMatches): bool
    {
        foreach ($titleMatches as $titleMatch) {
            if ($match['start'] >= $titleMatch['start'] && $match['end'] <= $titleMatch['end']) {
                return true;
            }
        }

        return false;
    }

    /** MOS values found inside a VOX span belong to that yellow VOX block, not to separate graphics. */
    private function objectsMentionedInVox(string $text, array $objects): array
    {
        $insideVox = false;
        $keys = [];
        foreach (explode("\n", str_replace(["\r\n", "\r", "\u{00a0}", "\u{202f}"], ["\n", "\n", ' ', ' '], $text)) as $line) {
            $line = trim($line);
            if (preg_match('/^(?:VOX(?:URI|[- ]URI)?)\b/iu', $line)) {
                $insideVox = true;
                continue;
            }
            if ($this->isVoxBoundary($line)) {
                $insideVox = false;
                continue;
            }
            if (! $insideVox) {
                continue;
            }
            foreach ($objects as $object) {
                foreach ($object['editableObjects'] as $field) {
                    if (trim($field['value']) !== '' && $this->findValue($line, $field['value'], false) !== null) {
                        $keys[$this->objectKey($object)] = true;
                        break;
                    }
                }
            }
        }

        return $keys;
    }

    private function isVoxGraphic(array $object): bool
    {
        return preg_match('/^(?:\d+[_-])?VOX(?:[_-]|$)/iu', trim($object['slug'] ?? '')) === 1;
    }

    private function isNameGraphic(array $object): bool
    {
        $this->configuredNameGraphicTemplates ??= array_map('mb_strtolower', $this->nameGraphicTemplates->templates());
        return in_array(mb_strtolower(trim($object['slug'] ?? '')), $this->configuredNameGraphicTemplates, true);
    }

    private function isVoxBoundary(string $line): bool
    {
        return preg_match('/^(?:TEXT|INTRO|BETA|OFF|LIVE|STAND[ \t]*UP|SINCRON|SNC|PRIN[ \t]+TELEFON|AMBIAN[ȚT][ĂA])\b/iu', $line) === 1;
    }

    private function normalized(string $text): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', ' ', strtolower(Str::ascii($text, 'ro'))));
    }

    private function isSpeakerHeading(string $line, array $match, array $object): bool
    {
        if ($match['start'] !== strlen($line) - strlen(ltrim($line))
            || preg_match('/^(?:REPORTER|IMAGINE|IMAGINI|MONTAJ|EDITOR|REDACTOR|OPERATOR)[ \t]*:/iu', ltrim($line))) {
            return false;
        }
        $name = substr($line, $match['start'], $match['end'] - $match['start']);
        $afterName = substr($line, $match['end']);
        $tail = preg_replace('/^[\s,:;–-]+/u', '', $afterName);
        if ($tail === '') {
            return true;
        }
        // An attribution at the start of a line is distinct from narration.
        if (preg_match('/\b(?:spune|declară|afirmă|susține|a[ \t]+(?:spus|declarat|afirmat))\b/iu', $tail)) {
            return false;
        }
        foreach ($object['editableObjects'] as $field) {
            if (in_array($this->normalized($field['name']), ['functie', 'function'], true)
                && $this->normalized($tail) === $this->normalized($field['value'])) {
                return true;
            }
        }

        return $name === mb_strtoupper($name) && (preg_match('/^[ \t]*[,:;–-]/u', $afterName)
            || $line === mb_strtoupper($line));
    }

    private function isUnmarkedSpeakerLine(string $line, array $objects): bool
    {
        foreach ($objects as $object) {
            foreach ($object['editableObjects'] as $field) {
                if (in_array($this->normalized($field['name']), ['nume', 'name'], true)) {
                    $match = $this->findValue($line, $field['value'], true);
                    if ($match !== null && $this->isSpeakerHeading($line, $match, $object)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /** Match whole words, ignoring accents/punctuation; tolerate one spelling edit in a name. */
    private function findValue(string $line, string $value, bool $name): ?array
    {
        $wanted = explode(' ', $this->normalized($value));
        if ($wanted === [''] || ($name && count($wanted) < 2)) {
            return null;
        }
        if ($name && array_slice($wanted, 0, 2) === ['e', 's'] && count($wanted) < 4) {
            return null;
        }
        preg_match_all('/[\p{L}\p{N}]+/u', $line, $matches, PREG_OFFSET_CAPTURE);
        $tokens = $matches[0];
        $variants = [$wanted];
        $hasEsTitle = $name && array_slice($wanted, 0, 2) === ['e', 's'];
        // One saved MOS name includes the Romanian diplomatic title "E.S.";
        // some scripts identify the same person without it.
        if ($hasEsTitle && count($wanted) > 2) {
            $variants[] = array_slice($wanted, 2);
        }
        $bestMatch = null;
        foreach ($variants as $expected) {
            if ($name && count($expected) < 2) {
                continue;
            }
            $starts = range(0, max(0, count($tokens) - count($expected)));
            $leadingEs = false;
            if ($name && ! $hasEsTitle && count($tokens) > 2
                && $this->normalized($tokens[0][0]) === 'e' && $this->normalized($tokens[1][0]) === 's') {
                $starts[] = 2;
                $leadingEs = true;
            }
            foreach (array_unique($starts) as $index) {
                if ($index + count($expected) > count($tokens)) {
                    continue;
                }
                $window = array_slice($tokens, $index, count($expected));
                $actual = array_map(fn ($token) => $this->normalized($token[0]), $window);
                if ($name) {
                    sort($actual);
                    $sortedExpected = $expected;
                    sort($sortedExpected);
                } else {
                    $sortedExpected = $expected;
                }
                $distance = 0;
                foreach ($sortedExpected as $wordIndex => $word) {
                    $edit = levenshtein($word, $actual[$wordIndex]);
                    if ($edit > 0 && (! $name || min(strlen($word), strlen($actual[$wordIndex])) < 5)) {
                        $distance = 2;
                        break;
                    }
                    $distance += $edit;
                }
                if ($distance <= ($name ? 1 : 0)) {
                    $last = $window[array_key_last($window)];
                    $startToken = $leadingEs && $index === 2 ? $tokens[0] : $window[0];
                    $match = ['start' => $startToken[1], 'end' => $last[1] + strlen($last[0]), 'distance' => $distance];
                    if (! $name) {
                        return $match;
                    }
                    if ($bestMatch === null || $distance < $bestMatch['distance']
                        || ($distance === $bestMatch['distance'] && $match['start'] < $bestMatch['start'])) {
                        $bestMatch = $match;
                    }
                }
            }
        }

        return $bestMatch;
    }

    private function speechStart(array $lines, int $index, int $end, array $object, array $objects): string
    {
        $tail = preg_replace('/^[\s,:;–-]+/u', '', substr($lines[$index], $end));
        $knownAttribution = false;
        foreach ($object['editableObjects'] as $field) {
            if (in_array($this->normalized($field['name']), ['functie', 'function'], true)) {
                $function = $this->findValue($tail, $field['value'], false);
                if ($function !== null && $function['start'] === 0) {
                    $tail = preg_replace('/^[\s,:;–-]+/u', '', substr($tail, $function['end']));
                    $knownAttribution = true;
                }
            }
        }
        // A comma after the name introduces its attribution, not the quote.
        if (! $knownAttribution && preg_match('/^[ \t]*,/', substr($lines[$index], $end))) {
            $tail = '';
        }
        $speech = $tail === '' ? [] : [$tail];
        for ($next = $index + 1; $next < count($lines); $next++) {
            $line = trim($lines[$next]);
            if (preg_match('/^(?:INTRO|BETA|OFF|LIVE|TEXT|VOX(?:URI)?|SINCRON|SNC|STAND[ \t]*UP|PRIN[ \t]+TELEFON|AMBIAN[ȚT][ĂA])\b/iu', $line)) {
                break;
            }
            if (preg_match('/^(?:REPORTER|IMAGINE|IMAGINI|MONTAJ|EDITOR|REDACTOR|OPERATOR)[ \t]*:/iu', $line)) {
                break;
            }
            if (preg_match('/^(?:SURSA|SURSĂ|SOURCE)[ \t]*:/iu', $line)) {
                continue;
            }
            if ($this->isUnmarkedSpeakerLine($line, $objects)) {
                break;
            }
            // File-reference lines may contain spaces in their path/filename.
            if (str_starts_with($line, '\\\\') || str_starts_with($line, '//') || preg_match('/^[a-z]:[\\\\\/]/iu', $line)) {
                continue;
            }
            $speech[] = $line;
        }
        // Retain a synthetic cue for the existing context-aware technical cleaner.
        $speechText = implode("\n", $speech);
        // Parenthesized content is excluded from the preview, including nested notes.
        $speechText = preg_replace('/\((?:[^()]++|(?R))*\)/u', '', $speechText);
        // ENPS may put the media ID and timecode directly before the quote,
        // without a TC label (for example: "8488 03:40 The quote...").
        // Strip only that leading production prefix; numbers in the quote stay.
        $timecode = '(?:\d{1,2}[:.]\d{2}(?::\d{2}(?:[.,]\d+)?)?|\d{1,2}[ \t]+\d{2})';
        $rangeSeparator = '(?:[-‐‑‒–—―]|\.{2,}|…)';
        $timecodeRange = $timecode.'[ \t]*'.$rangeSeparator.'[ \t]*'.$timecode;
        $tcPrefix = '(?:(?:T[ \t]*\.?[ \t]*C\.?|TC|TIMECODE)[ \t]*:?[ \t]*)';
        $speechText = preg_replace('/^[ \t]*(?:\d+[ \t]+)?(?:TITRE|TC)\b[ \t]*:?[ \t]*(?=\d)/imu', 'T.C. ', $speechText);
        // Keep timecodes visible to cleanSpeech so it can trim matching quote
        // endpoints, while removing a media ID that precedes the timecode.
        $speechText = preg_replace('/^[ \t]*\d{3,}[ \t]*\R(?=[ \t]*'.$tcPrefix.'?'.$timecode.')/imu', '', $speechText);
        $speechText = preg_replace('/^[ \t]*\d{3,}[ \t]+(?='.$tcPrefix.'?'.$timecode.')/imu', '', $speechText);
        $speechText = preg_replace('/^[ \t]*('.$timecode.')[ \t]+MARKER\b[ \t]+('.$timecode.')/imu', 'T.C. $1 - $2', $speechText);
        $speechText = preg_replace('/^[ \t]*('.$timecode.')[ \t]+MARKER\b/imu', 'T.C. $1', $speechText);
        $speechText = preg_replace('/^[ \t]*MARKER\b[ \t]+('.$timecode.')/imu', 'T.C. $1', $speechText);
        // The adapter recognizes dash-separated TC ranges; normalize ENPS
        // ellipses here so it can trim both endpoints and the quote tail.
        $speechText = preg_replace('/^([ \t]*'.$tcPrefix.$timecode.')[ \t]*(?:…|\.{2,})[ \t]*('.$timecode.')/imu', '$1 - $2', $speechText);
        $speechText = preg_replace('/^[ \t]*'.$timecodeRange.'(?=[ \t]|$)/imu', 'T.C. $0', $speechText);
        $clean = $this->adapter->cleanSpeech("STAND UP\n".$speechText);
        // Video numbers are production metadata too. Remove their numeric ID
        // with the label so the quote can begin on the following line.
        $clean = preg_replace('/^[ \t]*(?:VIDEO[ \t]+NR\.?[ \t]*[:#-]?[ \t]*)+(?:\d+[ \t]*[:.]?[ \t]*)?/imu', '', $clean);
        $clean = preg_replace('/^[ \t]*(?:(?:T[ \t]*\.?[ \t]*C\.?|TC|TIMECODE)[ \t]*:?[ \t]*)+/imu', '', $clean);
        // cleanSpeech handles ordinary TC ranges and quote endpoints. This
        // catches the production prefixes it cannot see behind video/media IDs.
        $clean = preg_replace('/^[ \t]*(?:\d{3,}[ \t]+)?'.$tcPrefix.$timecode.'(?:[ \t]*'.$rangeSeparator.'[ \t]*'.$timecode.')?[ \t]*/imu', '', $clean);
        $clean = preg_replace('/^[ \t]*\d{3,}[ \t]+'.$timecode.'(?:[ \t]*'.$rangeSeparator.'[ \t]*'.$timecode.')?[ \t]*/imu', '', $clean);
        $clean = preg_replace('/^[ \t]*'.$timecodeRange.'(?:[ \t]+MU[ȘS]C[ĂA]\b(?:[ \t]+'.$timecodeRange.')?)?[ \t]*/imu', '', $clean);
        $clean = preg_replace('/^[ \t]*MU[ȘS]C[ĂA]\b[ \t]+'.$timecode.'(?:[ \t]*(?:'.$rangeSeparator.'[ \t]*|[ \t]+)'.$timecode.')?[ \t]*/imu', '', $clean);
        $clean = preg_replace('/^[ \t]*MU[ȘS]C[ĂA]\b[ \t]*/imu', '', $clean);
        // Explicit marker ranges may occur inside a quote or without a second
        // endpoint; removing the marker and adjacent timecodes preserves speech.
        $clean = preg_replace('/(?<![\p{L}\p{N}])(?:'.$timecode.'[ \t]+MARKER\b(?:[ \t]+'.$timecode.')?|MARKER\b[ \t]+'.$timecode.')(?![\p{L}\p{N}])/iu', ' ', $clean);
        preg_match_all('/[\p{L}\p{N}]+(?:[’\x{0027}-][\p{L}\p{N}]+)*/u', $clean, $words);
        // Production labels and timecodes are stripped above; numerals left in
        // the cleaned quote are spoken content and count among its first words.
        $spoken = array_values(array_filter($words[0], fn ($word) => ! in_array(mb_strtoupper($word), ['TITRE', 'TIMECODE'], true)));

        return implode(' ', array_slice($spoken, 0, 7));
    }
}
