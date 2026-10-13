<?php

namespace App\Services\Enps;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

class EnpsBasicContent
{
    /** Classify editable fields independently of the story or graphic template. */
    public static function editableRole(string $name): string
    {
        $name = mb_strtolower(trim(preg_replace('/[\s\p{Z}]+/u', ' ', $name) ?? $name));

        return match ($name) {
            'titlu' => 'title',
            'titlu scurt' => 'short_title',
            default => 'value',
        };
    }

    /** Read the complete script, excluding HTML/MOS presentation metadata. */
    public static function editorialText(array $content): string
    {
        $html = '';
        foreach ($content['ObjectProperties'] ?? [] as $property) {
            if (is_array($property) && strcasecmp((string) ($property['FieldName'] ?? ''), 'Text') === 0
                && is_string($property['FieldValue'] ?? null)) {
                $html = $property['FieldValue'];
                break;
            }
        }
        if ($html === '' || ! preg_match('/<[a-z][^>]*>/i', $html)) {
            return $html;
        }
        $previous = libxml_use_internal_errors(true);
        try {
            $document = new DOMDocument;
            if (! $document->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NONET)) {
                return '';
            }
            $read = function (DOMNode $node) use (&$read): string {
                if ($node->nodeType === XML_TEXT_NODE) {
                    return $node->nodeValue;
                }
                if (! $node instanceof DOMElement) {
                    return '';
                }
                $tag = strtolower($node->tagName);
                if (in_array($tag, ['head', 'script', 'style', 'template'], true)
                    || preg_match('/(?:^|\s)(?:MOS-\S+|MOSInfo|MOSDetails|ProductionCommand\S*)(?:\s|$)/i', $node->getAttribute('class'))) {
                    return '';
                }
                if ($tag === 'br') {
                    return "\n";
                }
                $text = '';
                foreach ($node->childNodes as $child) {
                    $text .= $read($child);
                }

                return in_array($tag, ['div', 'p', 'li', 'tr', 'h1', 'h2', 'h3'], true) ? "\n".$text."\n" : $text;
            };

            return $read($document->getElementsByTagName('body')->item(0) ?? $document->documentElement);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    /** Keep record data, never authentication/session envelopes or headers. */
    public static function forStorage(array $content): array
    {
        $record = array_intersect_key($content, array_flip([
            'ReadTime', 'Actual', 'Estimated', 'HardHitFront', 'HardHitBack',
            'ActualTimeString', 'PageNum', 'EditLocked', 'EditLockedBy', 'DefaultLayout',
            'Loading', 'ObjectProperties', 'ListData', 'ObjectLinks', 'SocialMediaLinks',
            'LinkedRecords', 'ObjectTags', 'ChatData', 'IsSearchReturnedResult',
        ]));

        return self::withoutSessionData($record);
    }

    private static function withoutSessionData(array $data): array
    {
        $result = [];
        foreach ($data as $key => $value) {
            if (is_string($key) && self::isSessionField($key)) {
                continue;
            }
            if (is_array($value) && is_string($value['FieldName'] ?? null) && self::isSessionField($value['FieldName'])) {
                continue;
            }
            $result[$key] = is_array($value) ? self::withoutSessionData($value) : $value;
        }

        return array_is_list($data) ? array_values($result) : $result;
    }

    private static function isSessionField(string $name): bool
    {
        return (bool) preg_match('/password|token|cookie|authorization|credential|session|devkey/i', $name);
    }

    /** Extract editable MOS fields while keeping repeated commands and their IDs. */
    public static function mosObjects(array $content): array
    {
        $commands = [];
        foreach ($content['ObjectProperties'] ?? [] as $property) {
            if (is_array($property) && ($property['FieldName'] ?? null) === 'TextCommands' && is_array($property['FieldValue'] ?? null)) {
                $commands = $property['FieldValue'];
                break;
            }
        }

        $objects = [];
        foreach ($commands as $id => $command) {
            if (! is_string($command) || ! preg_match('/<mos\b.*<\/mos>/isu', $command, $match)) {
                continue;
            }
            // ENPS uses non-breaking spaces even between XML attributes.
            $xml = str_replace(["\u{00A0}", '&nbsp;'], [' ', '&#160;'], $match[0]);
            if (stripos($xml, '<!DOCTYPE') !== false || stripos($xml, '<!ENTITY') !== false) {
                continue;
            }
            $previous = libxml_use_internal_errors(true);
            try {
                $document = new DOMDocument;
                if (! $document->loadXML($xml, LIBXML_NONET)) {
                    continue;
                }
                $xpath = new DOMXPath($document);
                $field = fn (string $name) => $xpath->evaluate('string(/*[local-name()="mos"]/*[local-name()="'.$name.'"])');
                $slug = $field('itemSlug');
                $editable = [];
                foreach ($xpath->query('//*[local-name()="editableObject"]') as $object) {
                    if (! $object instanceof DOMElement) {
                        continue;
                    }
                    $name = $xpath->evaluate('string(*[local-name()="name"])', $object);
                    $value = $xpath->evaluate('string(*[local-name()="value"])', $object);
                    if ($slug === '05_Titlu_Ultima_Ora' && self::editableRole($name) === 'short_title') {
                        $uppercase = mb_strtoupper($value, 'UTF-8');
                        $value = mb_strtolower($uppercase, 'UTF-8');
                        $value = preg_replace_callback('/^([\s\p{Z}]*)(\p{L})/u', fn ($match) => $match[1].mb_strtoupper($match[2], 'UTF-8'), $value) ?? $value;
                    }
                    $editable[] = [
                        'type' => $object->getAttribute('type'),
                        'name' => $name,
                        'value' => $value,
                    ];
                }
                $objects[] = [
                    'commandId' => (string) $id,
                    'itemId' => $field('itemID'),
                    'objectId' => $field('objID'),
                    'mosId' => $field('mosID'),
                    'slug' => $slug,
                    'abstract' => $field('mosAbstract'),
                    'editableObjects' => $editable,
                ];
            } finally {
                libxml_clear_errors();
                libxml_use_internal_errors($previous);
            }
        }

        return $objects;
    }
}
