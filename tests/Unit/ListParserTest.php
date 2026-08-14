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
}
