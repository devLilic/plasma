<?php

namespace Tests\Unit;

use App\Services\Parser\ListParser;
use App\Services\Playlists\PlaylistTitleExclusions;
use PHPUnit\Framework\TestCase;

class ListParserTest extends TestCase
{
    public function test_it_keeps_teases_separate_from_articles_with_the_same_subject(): void
    {
        $exclusions = $this->createMock(PlaylistTitleExclusions::class);
        $exclusions->method('terms')->willReturn([]);
        $parser = new ListParser($exclusions);
        $html = <<<'HTML'
<UL>
<LI><A HREF=#TEASE PERICOL TROTINETE>TEASE PERICOL TROTINETE</A>
<LI><A HREF=#MD PERICOL TROTINETE-INTRO>MD PERICOL TROTINETE-INTRO</A>
<LI><A HREF=#MD PERICOL TROTINETE-BETA>MD PERICOL TROTINETE-BETA</A>
<LI><A HREF=#RO  SITUATIE PETROL-INTRO>RO  SITUATIE PETROL-INTRO</A>
<LI><A HREF=#RO  SITUATIE PETROL-BETA>RO  SITUATIE PETROL-BETA</A>
</UL>
HTML;

        $articles = $parser->parse($html)->get();

        $this->assertSame([
            'TEASE PERICOL TROTINETE',
            'PERICOL TROTINETE',
            'SITUATIE PETROL',
        ], array_keys($articles));
        $this->assertSame([
            'TEASE PERICOL TROTINETE',
        ], $articles['TEASE PERICOL TROTINETE']);
        $this->assertSame([
            'MD PERICOL TROTINETE-INTRO',
            'MD PERICOL TROTINETE-BETA',
        ], $articles['PERICOL TROTINETE']);
        $this->assertSame([
            'RO  SITUATIE PETROL-INTRO',
            'RO  SITUATIE PETROL-BETA',
        ], $articles['SITUATIE PETROL']);
    }

    public function test_it_exposes_the_exact_technical_title_and_ordered_section_slugs(): void
    {
        $exclusions = $this->createMock(PlaylistTitleExclusions::class);
        $exclusions->method('terms')->willReturn([]);
        $parser = new ListParser($exclusions);
        $html = <<<'HTML'
<UL>
<LI><A HREF=#MD INCENDIU-INTRO>MD INCENDIU-INTRO</A>
<LI><A HREF=#MD INCENDIU-OFF>MD INCENDIU-OFF</A>
<LI><A HREF=#MD INCENDIU-SNC>MD INCENDIU-SNC</A>
</UL>
HTML;

        $entry = $parser->parse($html)->entries()[0];

        $this->assertSame('INCENDIU', $entry['search']);
        $this->assertSame('MD INCENDIU', $entry['technical_title']);
        $this->assertSame([
            'MD INCENDIU-INTRO',
            'MD INCENDIU-OFF',
            'MD INCENDIU-SNC',
        ], $entry['slugs']);
    }
}
