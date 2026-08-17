<?php

namespace Tests\Unit;

use App\Services\Articles\ArticlesService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticlesServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_extracts_titles_from_the_supported_editorial_formats(): void
    {
        $html = file_get_contents(base_path('tests/titles/x3007TELEJURNAL_1300.HTM'));
        $articles = collect((new ArticlesService)->generate($html))->keyBy('search_slug');

        $this->assertSame(
            'PARLAMENTUL DECIDE VIITORUL ALEGERILOR DIN UTA GĂGĂUZIA',
            $articles['ALEGERI GAGAUZIA PARLAMENT']->title
        );

        $this->assertSame('TRAFIC DE PERSOANE', $articles['TRAFIC DE PERSOANE']->title);
        $this->assertSame('IRAN MATINAL', $articles['IRAN MATINAL']->title);
        $this->assertSame('JAPONIA SITUATIE', $articles['JAPONIA SITUATIE']->title);
        $this->assertSame('FAKE MASURI GUVERN', $articles['FAKE MASURI GUVERN']->title);
    }

    public function test_it_preserves_titles_that_were_already_parsed_correctly(): void
    {
        $html = file_get_contents(base_path('tests/titles/x3007TELEJURNAL_1300.HTM'));
        $articles = collect((new ArticlesService)->generate($html))->keyBy('search_slug');

        $this->assertSame(
            'VASILE TOFAN, ÎN PRIMA VIZITĂ OFICIALĂ LA BUCUREŞTI',
            $articles['FAKE VIZITA TOFAN ROMANIA']->title
        );
        $this->assertSame(
            'CENTRALA NUCLEARĂ PAKS A REDUS PUTEREA REACTORULUI 2',
            $articles['CENTRALA UNGARIA MATINAL']->title
        );
        $this->assertSame('INCENDIU DE PROPORȚII ÎN CHIŞINĂU', $articles['INCENDIU']->title);
        $this->assertSame(
            '5 MORŢI LA RIO DE JANEIRO ÎN URMA UNEI FURTUNI',
            $articles['RIO FURTUNA VIOLENTA']->title
        );
    }

    public function test_it_preserves_technical_titles_and_assigns_multiple_supported_types(): void
    {
        $html = file_get_contents(base_path('tests/titles/x3007TELEJURNAL_1300.HTM'));
        $articles = collect((new ArticlesService)->generate($html))->keyBy('search_slug');

        $this->assertSame('MD INCENDIU', $articles['INCENDIU']->technical_title);
        $this->assertSame(['OFF'], $articles['INCENDIU']->types);
        $this->assertSame(['LIVE', 'BETA'], $articles['LIVE DECLARATII BUCURESTI']->types);
        $this->assertSame(['FAKE'], $articles['FAKE VIZITA TOFAN ROMANIA']->types);
        $this->assertSame(['HEADER', 'BETA'], $articles['HEADLINES']->types);

        $secondHtml = file_get_contents(base_path('tests/titles/x1108 TELEJURNAL  1900.HTM'));
        $secondPlaylist = collect((new ArticlesService)->generate($secondHtml))->keyBy('search_slug');
        $this->assertSame(['METEO', 'BETA'], $secondPlaylist['METEO']->types);
        $this->assertSame(['CURS', 'BETA'], $secondPlaylist['CURS VALUTAR']->types);
    }
}
