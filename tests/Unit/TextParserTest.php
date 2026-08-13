<?php

namespace Tests\Unit;

use App\Services\Parser\TextParser;
use PHPUnit\Framework\TestCase;

class TextParserTest extends TestCase
{
    public function test_numeric_placeholders_fall_back_to_the_clean_identifier(): void
    {
        $parser = (new TextParser)->parse($this->document([
            'RO IRAN-OFF' => ['1', 'OFF', 'Textul materialului'],
            'RO IRAN-SNC' => ['1'],
        ]));

        $this->assertSame('IRAN', $parser->get_title_for(['RO IRAN-INTRO', 'RO IRAN-OFF', 'RO IRAN-SNC'], 'IRAN'));
    }

    public function test_technical_identifiers_are_not_used_as_editorial_titles(): void
    {
        $parser = (new TextParser)->parse($this->document([
            'MD STARE DE ALERTA ENERGETICA-BETA' => ['MD STARE DE ALERTA ENERGETICA 19', 'INTRO:', 'Textul materialului'],
        ]));

        $this->assertSame(
            'STARE DE ALERTA ENERGETICA',
            $parser->get_title_for(['MD STARE DE ALERTA ENERGETICA-INTRO', 'MD STARE DE ALERTA ENERGETICA-BETA'], 'STARE DE ALERTA ENERGETICA')
        );
    }

    public function test_explicit_titles_have_priority_across_all_sections(): void
    {
        $parser = (new TextParser)->parse($this->document([
            'MD MATERIAL-BETA' => ['VARIANTA GREȘITĂ'],
            'MD MATERIAL-OFF' => ['TITLU:', 'TITLUL EDITORIAL CORECT'],
        ]));

        $this->assertSame(
            'TITLUL EDITORIAL CORECT',
            $parser->get_title_for(['MD MATERIAL-INTRO', 'MD MATERIAL-BETA', 'MD MATERIAL-OFF'], 'MATERIAL')
        );
    }

    private function document(array $sections): string
    {
        return collect($sections)->map(function ($paragraphs, $slug) {
            $content = collect($paragraphs)->map(fn ($paragraph) => '<P>'.$paragraph)->implode("\r\n");

            return '<A NAME='.$slug.'>'.$content."\r\n<FONT  SIZE=-2>";
        })->implode("\r\n");
    }
}
