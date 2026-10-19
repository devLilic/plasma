<?php

namespace Tests\Feature;

use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Playlist;
use App\Models\User;
use App\Services\Articles\ArticleMosTimeline;
use App\Services\Enps\EnpsBasicContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ArticleMosTimelineTest extends TestCase
{
    use RefreshDatabase;

    private function graphic(string $id, string $name, string $value, string $function = ''): array
    {
        $fields = [['name' => $name, 'value' => $value, 'role' => EnpsBasicContent::editableRole($name)]];
        if ($function !== '') {
            $fields[] = ['name' => 'Functie', 'value' => $function, 'role' => 'value'];
        }

        return ['commandId' => $id, 'slug' => $name === 'Titlu' ? '05_Titlu_Ultima_Ora' : '06_Nume_Ultima_Ora', 'editableObjects' => $fields];
    }

    public function test_configured_02_name_graphic_uses_its_text_value_to_extract_the_persons_seven_spoken_words(): void
    {
        $object = ['commandId' => 'name-lower-third', 'slug' => '02_Nume', 'editableObjects' => [
            ['name' => 'Text', 'value' => 'IRINA MIHAILICI, jurnalist TVR MOLDOVA', 'role' => 'value'],
        ]];
        $text = "INTRO Introducere editorială.\nIRINA MIHAILICI, jurnalist TVR MOLDOVA\nDeficitul comercial al Republicii Moldova a depășit 4,4 miliarde de euro.";

        $events = app(ArticleMosTimeline::class)->scan($text, [$object]);

        $this->assertCount(1, $events);
        $this->assertSame('name-lower-third', $events[0]['object']['commandId']);
        $this->assertSame('Deficitul comercial al Republicii Moldova a depășit', $events[0]['snippet']);
    }

    public function test_repeated_story_attributions_do_not_cross_match_equivalent_commands_or_the_headline(): void
    {
        $headline = $this->graphic('headline', 'Titlu', 'MARTA KOS: NEGOCIERILE CU UE AR PUTEA FI ÎNCHEIATE ÎN 2028');
        $cristina = $this->graphic('cristina-first', 'NUME', 'CRISTINA GHERASIMOV', 'viceprim-ministra');
        $cristinaDuplicate = $this->graphic('cristina-duplicate', 'NUME', 'Cristina Gherasimov', 'viceprim-ministra');
        $cristinaDuplicate['slug'] = '09_Nume_Fullscreen';
        $cristinaDuplicate['editableObjects'][] = ['name' => 'Instituție', 'value' => 'Guvernul Republicii Moldova', 'role' => 'value'];
        $cristinaSurplusDuplicate = $this->graphic('cristina-surplus-duplicate', 'NUME', 'CRISTINA GHERASIMOV', 'viceprim-ministra');
        $cristinaVariant = $this->graphic('cristina-distinct-template', 'NUME', 'CRISTINA GHERASIMOV', 'viceprim-ministra');
        $cristinaVariant['slug'] = '09_Nume_AltTemplate';
        $cristinaVariant['editableObjects'][] = ['name' => 'Instituție', 'value' => 'Guvernul Republicii Moldova — mandat anterior', 'role' => 'value'];
        $thomas = $this->graphic('thomas', 'NUME', 'THOMAS BYRNE', 'ministru');
        $marta = $this->graphic('marta', 'NUME', 'MARTA KOS', 'comisar european');
        $credit = $this->graphic('credit', 'NUME', 'CARINA MULLER', 'reporter');
        $objects = [$headline, $cristina, $cristinaDuplicate, $cristinaSurplusDuplicate, $cristinaVariant, $thomas, $marta, $credit];
        $text = implode("\n", [
            'MARTA KOS: NEGOCIERILE CU UE AR PUTEA FI ÎNCHEIATE ÎN 2028',
            'SNC CRISTINA GHERASIMOV, viceprim-ministra',
            'Obiectivul nostru imediat este să deschidem cele două clustere pentru negocieri.',
            'TEXT Narațiune despre Thomas Byrne și Marta Kos.',
            'SNC THOMAS BYRNE, ministru',
            'Irlanda va continua să depună toate eforturile pentru aderarea Moldovei.',
            'SNC MARTA KOS, comisar european',
            'Până acum, lucrurile au mers excelent în procesul de aderare.',
            'SNC CRISTINA GHERASIMOV, viceprim-ministra',
            'Ne-am exprimat interesul pentru alte programe europene.',
            'REPORTER: CARINA MULLER',
        ]);

        $scanned = app(ArticleMosTimeline::class)->scan($text, $objects);

        $this->assertSame(
            ['headline', 'cristina-first', 'thomas', 'marta', 'cristina-duplicate'],
            array_column(array_column($scanned, 'object'), 'commandId'),
        );
        $this->assertSame([
            '',
            'Obiectivul nostru imediat este să deschidem cele',
            'Irlanda va continua să depună toate eforturile',
            'Până acum lucrurile au mers excelent în',
            'Ne-am exprimat interesul pentru alte programe europene',
        ], array_column($scanned, 'snippet'));
        $this->assertSame([0, 1, 4, 6, 8], array_column($scanned, 'sourceLine'));
        $this->assertSame('09_Nume_Fullscreen', $scanned[4]['object']['slug']);
        $this->assertSame('Guvernul Republicii Moldova', $scanned[4]['object']['editableObjects'][2]['value']);

        $complete = app(ArticleMosTimeline::class)->forArticle(new Article, $objects, [['type' => 'BETA', 'paragraphs' => [$text]]]);

        $this->assertSame(
            ['headline', 'cristina-first', 'thomas', 'marta', 'cristina-duplicate', 'cristina-surplus-duplicate', 'cristina-distinct-template', 'credit'],
            array_column(array_column($complete, 'object'), 'commandId'),
        );
        $this->assertSame(['mos', 'mos', 'mos', 'mos', 'mos', 'mos', 'mos', 'mos'], array_column($complete, 'kind'));
        $this->assertSame(1, count(array_filter($complete, fn ($event) => $event['object']['commandId'] === 'credit')));
        $this->assertSame(1, count(array_filter($complete, fn ($event) => $event['object']['commandId'] === 'cristina-surplus-duplicate')));
        $this->assertSame(1, count(array_filter($complete, fn ($event) => $event['object']['commandId'] === 'cristina-distinct-template')));
        foreach ([5, 6, 7] as $index) {
            $this->assertNull($complete[$index]['position']);
            $this->assertNull($complete[$index]['sourceLine']);
            $this->assertSame('', $complete[$index]['snippet']);
        }
    }

    public function test_every_surplus_equivalent_speaker_command_is_appended_once_without_an_invented_attribution(): void
    {
        $objects = array_map(fn ($index) => $this->graphic("daniel-$index", 'NUME', 'DANIEL VODA', 'ambasador'), range(1, 3));
        $text = "SNC DANIEL VODA, ambasador\nDaniel Voda a declarat că avem 2 soluții pentru discuții.";

        $scanned = app(ArticleMosTimeline::class)->scan($text, $objects);
        $this->assertSame(['daniel-1'], array_column(array_column($scanned, 'object'), 'commandId'));

        $complete = app(ArticleMosTimeline::class)->forArticle(new Article, $objects, [['type' => 'BETA', 'paragraphs' => [$text]]]);

        $this->assertSame(['daniel-1', 'daniel-2', 'daniel-3'], array_column(array_column($complete, 'object'), 'commandId'));
        $this->assertSame([true, false, false], array_map(fn ($event) => $event['position'] !== null, $complete));
        $this->assertSame([null, null], array_slice(array_column($complete, 'sourceLine'), 1));
        $this->assertSame(['', ''], array_slice(array_column($complete, 'snippet'), 1));
    }

    public function test_many_repeated_attributions_pair_with_equivalent_commands_in_order_without_cartesian_duplicates(): void
    {
        $title = $this->graphic('story-title', 'Titlu', 'BĂTĂLIA AMBASADELOR');
        $daniel = array_map(fn ($index) => $this->graphic("daniel-$index", 'NUME', 'DANIEL VODA', 'ambasador'), range(1, 6));
        $ion = array_map(fn ($index) => $this->graphic("ion-$index", 'NUME', 'ION TABARTA', 'ambasador'), range(1, 3));
        $otherSpeakers = [
            $this->graphic('cristian', 'NUME', 'CRISTIAN-LEON TURCANU', 'ambasador'),
            $this->graphic('joseph', 'NUME', 'JOSEPH MARK BURKHALTER', 'ambasador'),
            $this->graphic('oleg', 'NUME', 'OLEG OZEROV', 'ambasador'),
        ];
        $objects = [$title, ...$daniel, ...$ion, ...$otherSpeakers];
        $cristian = $this->graphic('cristian', 'NUME', 'E.S. CRISTIAN-LEON TURCANU', 'ambasador');
        $joseph = $this->graphic('joseph', 'NUME', 'E.S. JOSEPH MARK BURKHALTER', 'ambasador');
        $otherSpeakers = [$cristian, $joseph, $otherSpeakers[2]];
        $objects = [$title, ...$daniel, ...$ion, ...$otherSpeakers];
        $attributions = [
            ['DANIEL VODA', 'Daniel Voda', 'daniel-1'],
            ['DANIEL VODA', 'Daniel Voda', 'daniel-2'],
            ['DANIEL VODA', 'Daniel Voda', 'daniel-3'],
            ['ION TABARTA', 'Ion Tabarta', 'ion-1'],
            ['CRISTIAN-LEON TURCANU', 'Cristian-Leon Turcanu', 'cristian'],
            ['DANIEL VODA', 'Daniel Voda', 'daniel-4'],
            ['JOSEPH MARK BURKHALTER', 'Joseph Mark Burkhalter', 'joseph'],
            ['DANIEL VODA', 'Daniel Voda', 'daniel-5'],
            ['ION TABARTA', 'Ion Tabarta', 'ion-2'],
            ['DANIEL VODA', 'Daniel Voda', 'daniel-6'],
            ['OLEG OZEROV', 'Oleg Ozerov', 'oleg'],
            ['ION TABARTA', 'Ion Tabarta', 'ion-3'],
        ];
        $lines = ['BĂTĂLIA AMBASADELOR'];
        foreach ($attributions as [$name, $spokenName]) {
            $lines[] = "SNC $name, ambasador";
            $lines[] = "$spokenName a declarat că discuțiile vor continua în zilele următoare.";
        }
        $text = implode("\n", $lines);

        $scanned = app(ArticleMosTimeline::class)->scan($text, $objects);

        $expectedIds = [
            'story-title', 'daniel-1', 'ion-1', 'cristian', 'joseph', 'oleg',
            'daniel-2', 'daniel-3', 'daniel-4', 'daniel-5', 'ion-2', 'daniel-6', 'ion-3',
        ];
        $this->assertSame($expectedIds, array_column(array_column($scanned, 'object'), 'commandId'));
        $this->assertCount(13, $scanned);
        $this->assertSame([0, 1, 7, 9, 13, 21, 3, 5, 11, 15, 17, 19, 23], array_column($scanned, 'sourceLine'));

        $complete = app(ArticleMosTimeline::class)->forArticle(new Article, $objects, [['type' => 'BETA', 'paragraphs' => [$text]]]);
        $this->assertSame($expectedIds, array_column(array_column($complete, 'object'), 'commandId'));
        $this->assertCount(13, $complete);
    }

    public function test_es_prefix_on_mos_name_script_name_or_both_still_locates_the_script_attribution(): void
    {
        $cases = [
            [$this->graphic('mos-prefix', 'NUME', 'E.S. JOSEPH MARK BURKHALTER'), 'SNC JOSEPH MARK BURKHALTER, ambasador'],
            [$this->graphic('script-prefix', 'NUME', 'CRISTIAN-LEON TURCANU'), 'SNC E.S. CRISTIAN-LEON TURCANU, ambasador'],
            [$this->graphic('both-prefix', 'NUME', 'E.S. OLEG OZEROV'), 'SNC E.S. OLEG OZEROV, ambasador'],
        ];

        $expectedPositions = [
            strpos($cases[0][1], 'JOSEPH'),
            strpos($cases[1][1], 'CRISTIAN'),
            strpos($cases[2][1], 'E.S.'),
        ];
        foreach ($cases as $index => [$object, $cue]) {
            $events = app(ArticleMosTimeline::class)->scan("$cue\nDeclarația confirmă că există 2 opțiuni pentru următoarele discuții.", [$object]);

            $this->assertCount(1, $events);
            $this->assertSame($object['commandId'], $events[0]['object']['commandId']);
            $this->assertSame('Declarația confirmă că există 2 opțiuni pentru', $events[0]['snippet']);
            $this->assertSame($expectedPositions[$index], $events[0]['position']);
        }
    }

    public function test_es_prefixed_name_can_be_an_unmarked_speaker_heading(): void
    {
        $speaker = $this->graphic('joseph', 'NUME', 'E.S. JOSEPH MARK BURKHALTER', 'ambasador');
        $events = app(ArticleMosTimeline::class)->scan(
            "E.S. JOSEPH MARK BURKHALTER, ambasador\nDeclarația confirmă că există 2 opțiuni pentru următoarele discuții.",
            [$speaker],
        );

        $this->assertCount(1, $events);
        $this->assertSame('joseph', $events[0]['object']['commandId']);
        $this->assertSame(0, $events[0]['sourceLine']);
        $this->assertSame('Declarația confirmă că există 2 opțiuni pentru', $events[0]['snippet']);
    }

    public function test_exact_speaker_match_takes_priority_over_a_fuzzy_candidate(): void
    {
        $fuzzy = $this->graphic('fuzzy', 'NUME', 'DANIEL VODAS', 'ambasador');
        $exact = $this->graphic('exact', 'NUME', 'DANIEL VODA', 'ambasador');
        $text = "SNC DANIEL VODA, ambasador\nPrima declarație conține 2 idei clare pentru public.\nSNC DANIEL VODAS, ambasador\nA doua declarație conține 3 idei clare pentru public.";

        $events = app(ArticleMosTimeline::class)->scan($text, [$fuzzy, $exact]);

        $this->assertSame(['fuzzy', 'exact'], array_column(array_column($events, 'object'), 'commandId'));
        $this->assertSame([
            'A doua declarație conține 3 idei clare',
            'Prima declarație conține 2 idei clare pentru',
        ], array_column($events, 'snippet'));
    }

    public function test_sync_preview_skips_source_lines_and_timecode_metadata_without_losing_spoken_numbers(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN');
        $text = implode("\n", [
            'SNC ANA ȘERBAN',
            'T.C. 09.33-10.01 musca',
            'În 2028 vor fi 2 clustere disponibile pentru negocieri.',
            'SNC ANA ȘERBAN',
            '07.46-07.59 musca 08.14–08.20',
            'Ne-am exprimat interesul pentru alte 3 programe în 2026.',
            'SNC ANA ȘERBAN',
            'SURSA: arhiva redacției',
            'SURSĂ: document intern',
            'SOURCE: newsroom archive',
            '00:14 MARKER 00:26 În 2027, am identificat 4 proiecte prioritare pentru aderare.',
        ]);

        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);

        $this->assertSame([
            'În 2028 vor fi 2 clustere disponibile',
            'Ne-am exprimat interesul pentru alte 3 programe',
            'În 2027 am identificat 4 proiecte prioritare',
        ], array_column($events, 'snippet'));
        foreach ($events as $event) {
            $this->assertDoesNotMatchRegularExpression('/(?:T\.C\.|MUSCA|SURSA|SURSĂ|SOURCE|MARKER)/iu', $event['snippet']);
        }
    }

    public function test_marker_is_removed_only_when_adjacent_to_a_timecode(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN');
        $spoken = app(ArticleMosTimeline::class)->scan(
            "SNC ANA ȘERBAN\nUn marker costă 2 lei în 2026.",
            [$speaker],
        );
        $technical = app(ArticleMosTimeline::class)->scan(
            "SNC ANA ȘERBAN\n00:05 MARKER Abia în 2026 am identificat 4 proiecte prioritare pentru Moldova.",
            [$speaker],
        );

        $this->assertSame('Un marker costă 2 lei în 2026', $spoken[0]['snippet']);
        $this->assertSame('Abia în 2026 am identificat 4 proiecte', $technical[0]['snippet']);
    }

    public function test_unlocated_graphics_are_appended_after_located_events_in_mos_order(): void
    {
        Http::preventStrayRequests();
        $objects = [
            $this->graphic('first', 'Titlu', 'Titlu absent'),
            $this->graphic('ana', 'NUME', 'ANA ȘERBAN'),
            $this->graphic('middle', 'NUME', 'EXANDRU BRECICO'),
            $this->graphic('middle-two', 'NUME', 'ALTCINEVA ABSENT'),
            $this->graphic('bogdan', 'NUME', 'BOGDAN STAN'),
            $this->graphic('last', 'NUME', 'REPORTER: IRINA MIHAILICI'),
        ];
        $text = "VOX\nTEXT Continuare.\nSNC ANA ȘERBAN\nPrima intervenție are șapte cuvinte distincte aici.\nTEXT Continuare.\nSNC BOGDAN STAN\nAltă intervenție cu text.\nTEXT Continuare.\nSNC ANA ȘERBAN\nA doua intervenție conține alte cuvinte aici.\nVOX";
        $events = app(ArticleMosTimeline::class)->forArticle(new Article, $objects, [['type' => 'BETA', 'paragraphs' => [$text]]]);
        $this->assertSame(['first', 'ana', 'bogdan', null, 'ana', null, 'middle', 'middle-two', 'last'], array_map(fn ($event) => $event['object']['commandId'] ?? null, $events));
        foreach ([0, 6, 7, 8] as $index) {
            $this->assertNull($events[$index]['position']);
            $this->assertNull($events[$index]['sourceLine']);
            $this->assertSame('', $events[$index]['snippet']);
        }
        $this->assertSame('Prima intervenție are șapte cuvinte distincte aici', $events[1]['snippet']);
        $this->assertSame('A doua intervenție conține alte cuvinte aici', $events[4]['snippet']);
        $this->assertSame(app(ArticleMosTimeline::class)->scan("BETA\n".$text, $objects), array_values(array_filter($events, fn ($event) => $event['position'] !== null)));
        Http::assertNothingSent();
    }

    public function test_first_title_graphic_is_promoted_before_vox_when_it_has_no_text_match(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN');
        $title = $this->graphic('title', 'Titlu', 'TITLU ABSENT DIN TEXT');
        $text = "VOX\nSNC ANA ȘERBAN\nPrima intervenție are câteva cuvinte distincte aici.";

        $events = app(ArticleMosTimeline::class)->forArticle(
            new Article,
            [$speaker, $title],
            [['type' => 'BETA', 'paragraphs' => [$text]]],
        );

        $this->assertSame(['title', 'ana', null], array_map(fn ($event) => $event['object']['commandId'] ?? null, $events));
        $this->assertNull($events[0]['position']);
        $this->assertSame('mos', $events[0]['kind']);
        $this->assertSame('vox', $events[2]['kind']);
    }

    public function test_vox_between_repeated_syncs_keeps_its_text_position_after_title_priority(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN');
        $title = $this->graphic('title', 'Titlu', 'TITLU ABSENT DIN TEXT');
        $text = "SNC ANA ȘERBAN\nPrima intervenție are șapte cuvinte distincte aici.\nVOX\nSNC ANA ȘERBAN\nA doua intervenție are alte șapte cuvinte distincte.";

        $events = app(ArticleMosTimeline::class)->forArticle(
            new Article,
            [$speaker, $title],
            [['type' => 'BETA', 'paragraphs' => [$text]]],
        );

        $this->assertSame(['title', 'ana', null, 'ana'], array_map(fn ($event) => $event['object']['commandId'] ?? null, $events));
        $this->assertSame(['mos', 'mos', 'vox', 'mos'], array_column($events, 'kind'));
        $this->assertSame('Prima intervenție are șapte cuvinte distincte aici', $events[1]['snippet']);
        $this->assertSame('A doua intervenție are alte șapte cuvinte', $events[3]['snippet']);
        $this->assertGreaterThan($events[1]['position'], $events[2]['position']);
        $this->assertGreaterThan($events[2]['position'], $events[3]['position']);
    }

    public function test_without_matches_all_visible_graphics_are_added_once_in_mos_order_including_unknown_fields(): void
    {
        $objects = [$this->graphic('first', 'Titlu', 'Primul titlu'), $this->graphic('second', 'Locatie', 'Chișinău'), $this->graphic('third', 'NUME', 'PERSOANĂ ABSENTĂ'), $this->graphic('empty', 'NUME', '   ')];
        $events = app(ArticleMosTimeline::class)->forArticle(new Article, $objects, []);
        $this->assertSame(['first', 'second', 'third'], array_column(array_column($events, 'object'), 'commandId'));
        $this->assertSame([null, null, null], array_column($events, 'position'));
        $this->assertSame(['', '', ''], array_column($events, 'snippet'));
        $this->assertSame([], app(ArticleMosTimeline::class)->forArticle(new Article, [], []));
    }

    public function test_completeness_keeps_identical_titles_once_and_preserves_distinct_short_titles(): void
    {
        $first = $this->graphic('first', 'Titlu', 'Titlul obișnuit');
        $duplicate = $this->graphic('duplicate', 'Titlu', "TITLUL\u{00a0}OBIȘNUIT");
        $different = $this->graphic('different', 'Titlu', 'Titlul obișnuit');
        $different['editableObjects'][] = ['name' => 'Titlu scurt', 'value' => 'Ultima oră'];
        foreach (['', 'Titlul obișnuit'] as $text) {
            $events = app(ArticleMosTimeline::class)->forArticle(new Article, [$first, $duplicate, $different], [['type' => 'BETA', 'paragraphs' => [$text]]]);
            $this->assertSame(['first', 'different'], array_column(array_column($events, 'object'), 'commandId'));
        }
    }

    public function test_real_script_locates_title_standup_vox_and_sync_in_source_order_without_moving_speech(): void
    {
        $fixture = json_decode(file_get_contents(base_path('tests/Fixtures/enps/truncated-beta.json')), true, flags: JSON_THROW_ON_ERROR);
        $text = EnpsBasicContent::editorialText($fixture['CollectionScripts'][1]['BasicContent']);
        $objects = [
            $this->graphic('nosatii', 'NUME', 'ANATOLIE NOSATÎI', 'ministrul Apărării al R. Moldova'),
            $this->graphic('title', 'Titlu', 'RACHETE ȘI DRONE ÎN SPAŢIUL AERIAN AL R. MOLDOVA. PATRU EXPLOZII'),
            $this->graphic('reporter', 'NUME', 'GABRIELA SULEAC', 'jurnalist TVR MOLDOVA'),
            $this->graphic('absent', 'NUME', 'Persoană Absentă'),
        ];
        $before = $text;
        $events = app(ArticleMosTimeline::class)->scan($text, $objects);
        $this->assertSame(['nosatii', 'title', 'reporter', null], array_map(fn ($event) => $event['object']['commandId'] ?? null, $events));
        $this->assertSame(['Cinci incidente raportate și fixate așa ca', '', 'Unul dintre aparatele de zbor a explodat', ''], array_column($events, 'snippet'));
        $this->assertNull($events[3]['count']);
        $this->assertSame($before, $text);
    }

    public function test_repeated_speakers_are_found_at_each_cue_but_narrative_mentions_and_absent_graphics_are_not(): void
    {
        $speaker = $this->graphic('ana', ' NUME ', 'Ana Șerban', 'reporter');
        $text = "Ana Șerban spune că a început ședința.\nSTAND UP ŞERBAN\u{00a0}ANA\n1234 clip\n00 01 Prima intervenție are cinci cuvinte exacte. 00 20\nTEXT Narațiune.\nSincron Ana Serban, reporter\nBRUT clip\n8037\n0 22 A doua intervenție rămâne întreagă. 0 40\nSNC ANA ȘERBAN: Ultima intervenție este pe același rând.\nSINCRON ALTĂ PERSOANĂ\nAlt citat.";
        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker, $this->graphic('absent', 'NUME', 'Persoană Absentă')]);
        $this->assertCount(3, $events);
        $this->assertSame(['Prima intervenție are cinci cuvinte exacte', 'A doua intervenție rămâne întreagă', 'Ultima intervenție este pe același rând'], array_column($events, 'snippet'));
        $this->assertSame(['ana', 'ana', 'ana'], array_column(array_column($events, 'object'), 'commandId'));
    }

    public function test_last_hour_titles_search_only_the_regular_title_and_keep_both_values_in_one_event(): void
    {
        $title = $this->graphic('title', 'Titlu', 'Titlul lung, obișnuit');
        $title['editableObjects'] = [ ['name' => 'TITLU SCURT', 'value' => 'ULTIMA ORĂ', 'role' => 'short_title'], ...$title['editableObjects'] ];
        $events = app(ArticleMosTimeline::class)->scan("ULTIMA ORĂ\nTITLU: titlul lung obișnuit\nTEXT Continuare\nTITLU TITLUL LUNG, OBIȘNUIT", [$title]);
        $this->assertCount(1, $events);
        $this->assertSame([1], array_column($events, 'sourceLine'));
        $this->assertSame($title, $events[0]['object']);
        $this->assertSame('', $events[0]['snippet']);
        $this->assertSame([], app(ArticleMosTimeline::class)->scan('ULTIMA ORĂ', [$title]));
    }

    public function test_identical_titles_are_kept_once_but_distinct_titles_and_repeated_syncs_remain_in_source_order(): void
    {
        $title = $this->graphic('title', 'Titlu', 'MUNCA PESTE PROGRAM');
        $duplicate = $this->graphic('other-command', 'Titlu', "munca\u{00a0}peste program");
        $other = $this->graphic('other-title', 'Titlu', 'O ALTĂ ȘTIRE');
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter');
        $text = "MUNCA PESTE PROGRAM\nINTRO Munca peste program\nSNC ANA ȘERBAN\nPrima intervenție are șapte cuvinte distincte aici. Continuare.\nTEXT MUNCA PESTE PROGRAM\nO ALTĂ ȘTIRE\nSNC ANA ȘERBAN\nA doua intervenție conține alte cuvinte aici. Continuare.";
        $events = app(ArticleMosTimeline::class)->scan($text, [$title, $duplicate, $other, $speaker]);
        $this->assertSame(['title', 'other-title', 'ana', 'ana'], array_column(array_column($events, 'object'), 'commandId'));
        $this->assertSame(['', '', 'Prima intervenție are șapte cuvinte distincte aici', 'A doua intervenție conține alte cuvinte aici'], array_column($events, 'snippet'));
        $this->assertSame([0, 5, 2, 6], array_column($events, 'sourceLine'));
    }

    public function test_first_unique_speaker_occurrences_follow_enps_order_and_repeats_follow_text_order(): void
    {
        $ion = $this->graphic('ion', 'NUME', 'ION TABARTA');
        $elena = $this->graphic('elena', 'NUME', 'ELENA POPESCU');
        $text = implode("\n", [
            'SNC ELENA POPESCU', 'Prima intervenție a Elenei are cuvinte distincte.',
            'SNC ION TABARTA', 'Prima intervenție a lui Ion are cuvinte distincte.',
            'SNC ION TABARTA', 'A doua intervenție a lui Ion are alte cuvinte.',
            'SNC ION TABARTA', 'A treia intervenție a lui Ion are alte cuvinte.',
            'SNC ELENA POPESCU', 'A doua intervenție a Elenei are alte cuvinte.',
        ]);

        $events = app(ArticleMosTimeline::class)->scan($text, [$ion, $elena]);

        $this->assertSame(['ion', 'elena', 'ion', 'ion', 'elena'], array_column(array_column($events, 'object'), 'commandId'));
        $this->assertSame([2, 0, 4, 6, 8], array_column($events, 'sourceLine'));
    }

    public function test_same_regular_title_with_different_short_titles_keeps_both_graphics(): void
    {
        $first = $this->graphic('first', 'Titlu', 'Titlul obișnuit');
        $first['editableObjects'][] = ['name' => 'Titlu scurt', 'value' => 'Primul titlu scurt'];
        $second = $this->graphic('second', 'Titlu', 'Titlul obișnuit');
        $second['editableObjects'] = [['name' => 'Titlu scurt', 'value' => 'Alt titlu scurt'], ...$second['editableObjects']];
        $events = app(ArticleMosTimeline::class)->scan("Titlul obișnuit\nTEXT Titlul obișnuit", [$first, $second]);
        $this->assertSame(['first', 'second'], array_column(array_column($events, 'object'), 'commandId'));
    }

    public function test_consecutive_vox_markers_count_occurrences_not_speaker_numbers_and_do_not_cross_text_blocks(): void
    {
        $text = "VOX 1\nPrimul citat.\nVOX 2\nAl doilea citat.\n\nTEXT Narațiune.\nVOX\nAlt citat.\nSTAND UP PERSOANĂ FĂRĂ MOS\nIntervenție.\nVOXURI\nTEXT Final.\nVOXURI 3";
        $events = app(ArticleMosTimeline::class)->scan($text, []);
        $this->assertSame([2, 1, null, 3], array_column($events, 'count'));
        $this->assertSame(['vox', 'vox', 'vox', 'vox'], array_column($events, 'kind'));
        $this->assertSame([], app(ArticleMosTimeline::class)->scan('Au fost mai multe voxuri în reportaj.', []));
    }

    public function test_vox_content_is_only_a_yellow_marker_and_does_not_create_mos_graphics(): void
    {
        $objects = [
            $this->graphic('carina', 'NUME', 'CARINA MULLER'),
            $this->graphic('location', 'Locatie', 'BRUXELLES'),
            ['commandId' => 'vox-graphic', 'slug' => 'VOX_Graphic', 'editableObjects' => [['name' => 'Text', 'value' => 'MOS intern VOX']]],
            ['commandId' => 'numbered-vox-graphic', 'slug' => '10_Vox', 'editableObjects' => [['name' => 'Text', 'value' => 'MOS intern VOX']]],
        ];
        $text = "VOX\nCARINA MULLER\nBRUXELLES\nMOS intern VOX\nTEXT\nBETA\nȘtirea continuă fără potriviri.";

        $events = app(ArticleMosTimeline::class)->forArticle(new Article, $objects, [['type' => 'BETA', 'paragraphs' => [$text]]]);

        $this->assertSame(['vox'], array_column($events, 'kind'));
        $this->assertNull($events[0]['object']);
    }

    public function test_snippet_stops_before_another_cue_and_strips_urls_paths_timecodes_and_function(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter');
        $text = "SINCRON ANA ȘERBAN, reporter T.C. 03.03 -03.20 musca 03.27 -03.36 https://example.test/clip Acesta este începutul declarației curățate.\nSNC ANA ȘERBAN\nVOX\nNu este declarația Anei.\nSNC ANA ȘERBAN\n\\\\server\\clip.mov\n8074_22\nT.C. 00:01 Cinci cuvinte rămân aici intacte.";
        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);
        $this->assertSame(['Acesta este începutul declarației curățate', '', '', 'Cinci cuvinte rămân aici intacte'], array_column($events, 'snippet'));
    }

    public function test_serialization_uses_cached_basic_content_including_removed_cues_without_network_or_database_mutations(): void
    {
        Http::preventStrayRequests();
        $this->actingAs(User::factory()->create());
        $playlist = Playlist::create(['title' => 'Jurnal', 'source_type' => 'enps']);
        $object = $this->graphic('reporter', 'NUME', 'ANA ȘERBAN');
        $missing = $this->graphic('missing', 'NUME', 'REPORTER: IRINA MIHAILICI');
        $article = $playlist->articles()->create(['title' => 'Știre', 'subtitle' => 'STIRE', 'intro' => '', 'article_type' => 'BETA', 'playlist_order' => 1, 'slugs' => 'MD STIRE-INTRO||MD STIRE-BETA', 'mos_objects' => [$object, $missing], 'content_sections' => [['type' => 'BETA', 'slug' => 'MD STIRE-BETA', 'paragraphs' => ['Primele cinci cuvinte ale intervenției.']]]]);
        $content = ['ObjectProperties' => [['FieldName' => 'Text', 'FieldValue' => '<p>STAND UP ANA ȘERBAN</p><p>8074 clip</p><p>00 01 Primele cinci cuvinte ale intervenției. 00 20</p><p>VOX</p>']], 'ListData' => ['password' => 'private'], 'thumbnail' => 'private'];
        $identity = ['source_database' => 'NEWS', 'source_path' => 'P_NEWS/W', 'source_guid' => 'guid', 'mos_objects' => []];
        $playlist->enpsItems()->create([...$identity, 'position' => 0, 'slug' => 'MD ALTA-BETA', 'basic_content' => ['ObjectProperties' => [['FieldName' => 'Text', 'FieldValue' => 'VOX']]]]);
        foreach ([1, 2] as $position) {
            $playlist->enpsItems()->create([...$identity, 'position' => $position, 'slug' => 'MD STIRE-BETA', 'basic_content' => $content]);
        }
        $article->refresh();
        $before = $article->getAttributes();
        $data = (new ArticleResource($article))->resolve();
        $this->assertSame(['mos', 'vox', 'mos'], array_column($data['mos_timeline'], 'kind'));
        $this->assertSame('missing', $data['mos_timeline'][2]['object']['commandId']);
        $this->assertNull($data['mos_timeline'][2]['position']);
        $this->assertSame('Primele cinci cuvinte ale intervenției', $data['mos_timeline'][0]['snippet']);
        $this->assertSame($before, $article->fresh()->getAttributes());
        $this->assertStringNotContainsString('private', json_encode($data));
        $this->get(route('playlists.show', $playlist))->assertInertia(fn ($page) => $page->where('articles.0.mos_timeline.0.snippet', 'Primele cinci cuvinte ale intervenției'));
        Http::assertNothingSent();
    }

    public function test_sync_preview_omits_production_metadata_and_preserves_numbers_in_spoken_text(): void
    {
        $object = $this->graphic('florentin', 'NUME', 'FLORENTIN PARMETIER', 'profesor la Universitatea Sciences Po, Paris');
        $text = "SNC: FLORENTIN PARMETIER, profesor la Universitatea Sciences Po, Paris\nTITRE 27:49–28:00:\nAș spune că apropierea de Uniunea Europeană va ajuta Republica Moldova.\nTEXT Narațiune.\nSNC FLORENTIN PARMETIER\n8037 clip\nTITRE 27 49 28 00 Aș spune că 2026 apropierea de Uniunea Europeană va ajuta.\nTEXT Final.\nSTAND UP FLORENTIN PARMETIER\nTITRE\nAș spune că apropierea de Uniunea Europeană va ajuta.";
        $before = $text;
        $events = app(ArticleMosTimeline::class)->scan($text, [$object]);
        $this->assertCount(3, $events);
        $this->assertSame(['Aș spune că apropierea de Uniunea Europeană', 'Aș spune că 2026 apropierea de Uniunea', 'Aș spune că apropierea de Uniunea Europeană'], array_column($events, 'snippet'));
        foreach ($events as $event) {
            $this->assertDoesNotMatchRegularExpression('/TITRE/u', $event['snippet']);
        }
        $this->assertSame($before, $text);
    }

    public function test_sync_preview_keeps_spoken_ages_after_removing_leading_media_and_timecode_metadata(): void
    {
        $speaker = $this->graphic('gheorghe', 'NUME', 'GHEORGHE CIOBANU', 'pacient');
        $text = "SNC GHEORGHE CIOBANU, pacient\n\\\\10.10.87.17\\Stiri\\HD\\OCTOMBRIE\\09\\transplant organe\n8445 TC 02:59 Eu aveam fix 60 de ani. Nu mă așteptam la nimic.";

        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);

        $this->assertCount(1, $events);
        $this->assertSame('Eu aveam fix 60 de ani Nu', $events[0]['snippet']);
    }

    public function test_sync_preview_removes_an_unlabelled_leading_media_id_and_timecode_but_keeps_spoken_numbers(): void
    {
        $speaker = $this->graphic('grigore', 'NUME', 'GRIGORE ROMANCIUC', 'directorul Agenției de Transplant');
        $text = "SNC GRIGORE ROMANCIUC, directorul Agenției de Transplant\n8488 03:40 În 2026 este necesar să avem 2 donatori.";

        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);

        $this->assertSame('În 2026 este necesar să avem 2', $events[0]['snippet']);
    }

    public function test_sync_preview_removes_a_leading_media_id_and_spaced_timecode(): void
    {
        $speaker = $this->graphic('aurelia', 'NUME', 'AURELIA TRIȘIȚILOVA', 'vicedirector Agenția de Transplant');
        foreach (['8489 02 53', '0611 00:42', '0612 04:14'] as $prefix) {
            $text = "SNC AURELIA TRIȘIȚILOVA, vicedirector Agenția de Transplant\n$prefix Cea mai mare provocare este egalitatea substanțelor de origine umană.";
            $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);
            $this->assertSame('Cea mai mare provocare este egalitatea substanțelor', $events[0]['snippet']);
        }
    }

    public function test_sync_preview_removes_media_id_and_timecode_range_on_separate_lines(): void
    {
        $speaker = $this->graphic('radu', 'NUME', 'RADU CORBU', 'instructor canin');
        $text = "SINCRON RADU CORBU, instructor canin\n8526\n00:16-00:45 Dacă avem o agresivitate la mâncare sau la jucării, se bazează doar pe instinct.";

        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);

        $this->assertSame('Dacă avem o agresivitate la mâncare sau', $events[0]['snippet']);
    }

    public function test_sync_preview_removes_both_timecodes_from_an_explicit_tc_range(): void
    {
        $speaker = $this->graphic('silvius', 'NUME', 'SILVIUS STANCIU', 'profesor universitar');
        $text = "SINCRON: SILVIUS STANCIU, profesor universitar\n8624 TC 00:59 … 01:14 Sunt vizate peste un milion de volume. Au crescut cu 2 în 2026.";

        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);

        $this->assertSame('Sunt vizate peste un milion de volume', $events[0]['snippet']);
    }

    public function test_tc_marker_is_excluded_before_counting_the_seven_spoken_words(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter');
        foreach (['TC', '7340 TC'] as $prefix) {
            $text = "SNC ANA ȘERBAN\n$prefix 00:20–00:42 Prima intervenție are șapte cuvinte distincte aici. Continuare.";
            $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);
            $this->assertSame('Prima intervenție are șapte cuvinte distincte aici', $events[0]['snippet']);
        }
    }

    public function test_leading_tc_and_spaced_t_c_markers_are_removed_even_without_a_following_timecode(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter');
        foreach (['TC', 'T C', 'T.C.', 'T C TC'] as $prefix) {
            $text = "SNC ANA ȘERBAN\n$prefix Nouă luni de chimioterapie schimbă rutina zilnică.";
            $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);
            $this->assertSame('Nouă luni de chimioterapie schimbă rutina zilnică', $events[0]['snippet']);
        }
    }

    public function test_video_nr_prefix_is_removed_from_the_start_of_sync_previews(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter');
        foreach ([
            'Video nr În ultimii de ani exporturile au crescut semnificativ.',
            'VIDEO NR.: În ultimii de ani exporturile au crescut semnificativ.',
            'Video nr TC 00:12–00:18 În ultimii de ani exporturile au crescut semnificativ.',
        ] as $speech) {
            $events = app(ArticleMosTimeline::class)->scan("SNC ANA ȘERBAN\n$speech", [$speaker]);
            $this->assertSame('În ultimii de ani exporturile au crescut', $events[0]['snippet']);
        }
    }

    public function test_video_number_on_its_own_line_is_removed_before_the_next_line_of_sync_text(): void
    {
        $speakers = [
            $this->graphic('zinaida', 'NUME', 'ZINAIDA DUMITRĂȘCU', 'profesor de fizică'),
            $this->graphic('ana', 'NUME', 'ANA NOVIC', 'director'),
        ];
        $text = "ZINAIDA DUMITRĂȘCU, profesor de fizică\nVideo nr. 2218\nTC 01:01 - 01:32 Fizica este foarte aproape de matematică, iar elevii...\nANA NOVIC, director\nVideo nr. 2265\nTC 00:53 - 01:18 A transformat sălile de clasă la științele exacte...";

        $events = app(ArticleMosTimeline::class)->scan($text, $speakers);

        $this->assertSame([
            'Fizica este foarte aproape de matematică iar',
            'A transformat sălile de clasă la științele',
        ], array_column($events, 'snippet'));
    }

    public function test_real_unmarked_person_appears_twice_with_its_own_speech_and_without_reporter_credits(): void
    {
        $source = json_decode(file_get_contents(base_path('tests/Fixtures/enps/unmarked-sync.json')), true, flags: JSON_THROW_ON_ERROR);
        $before = $source['text'];
        $events = app(ArticleMosTimeline::class)->scan($source['text'], $source['objects']);
        $speakers = array_values(array_filter($events, fn ($event) => collect($event['object']['editableObjects'] ?? [])->contains(fn ($field) => $field['value'] === 'OLEG OZEROV')));
        $this->assertCount(2, $speakers);
        $this->assertSame(['Atunci vă rog să menționați în mod', 'Nu știu Vorbiți despre situații ipotetice puțin'], array_column($speakers, 'snippet'));
        $this->assertLessThan($speakers[1]['position'], $speakers[0]['position']);
        $this->assertCount(3, $events);
        $this->assertStringNotContainsString('CARINA', json_encode($events, JSON_UNESCAPED_UNICODE));
        $this->assertSame($before, $source['text']);
    }

    public function test_unmarked_name_function_headings_allow_mixed_case_but_reject_narration_and_credits(): void
    {
        $speaker = $this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter');
        $credit = $this->graphic('credit', 'NUME', 'REPORTER: CARINA MULLER', 'Imagine: Vadim Verbnîi');
        $text = "Ana Șerban spune că a început ședința.\nANA ȘERBAN, reporter, spune că a început ședința.\nAna Şerban, reporter\nTITRE 00:01–00:04\nPrimele cinci cuvinte ale intervenției.\nTEXT Continuare editorială.\nANA ȘERBAN, reporter\nA doua intervenție începe diferit.\nTEXT Finalul editorial.\nREPORTER: CARINA MULLER\nImagine: Vadim Verbnîi";
        $events = app(ArticleMosTimeline::class)->scan($text, [$speaker, $credit]);
        $this->assertCount(2, $events);
        $this->assertSame(['Primele cinci cuvinte ale intervenției', 'A doua intervenție începe diferit'], array_column($events, 'snippet'));
        $this->assertSame(['ana', 'ana'], array_column(array_column($events, 'object'), 'commandId'));
    }

    public function test_unmarked_next_person_does_not_supply_the_previous_person_missing_words(): void
    {
        $objects = [$this->graphic('ana', 'NUME', 'ANA ȘERBAN', 'reporter'), $this->graphic('bogdan', 'NUME', 'BOGDAN STAN', 'director')];
        $text = "ANA ȘERBAN, reporter\nBOGDAN STAN, director\nPrimele cinci cuvinte ale directorului.\nTEXT Continuare.\nANA ȘERBAN, reporter\nDoar două.\nBOGDAN STAN, director\nDirectorul are încă o intervenție.";
        $events = app(ArticleMosTimeline::class)->scan($text, $objects);
        $this->assertSame(['', 'Primele cinci cuvinte ale directorului', 'Doar două', 'Directorul are încă o intervenție'], array_column($events, 'snippet'));
    }

    public function test_parenthesized_text_is_excluded_but_the_first_question_still_supplies_the_seven_words(): void
    {
        $speaker = $this->graphic('oleg', 'NUME', 'OLEG OZEROV', 'ambasador');
        foreach ([
            "OLEG OZEROV, ambasador\nTITRE: (montaj: insist să punem cu întrebarea noastră)\n- Atunci, vă rog să menționați, ce dovezi sunt suficiente?\n- Nu vorbim despre asta.",
            "Oleg Ozerov, ambasador\nTITRE: (notă fără marcaj (detaliu intern)) - Atunci, vă rog (indicație) să menționați, ce dovezi sunt suficiente? - Nu vorbim despre asta.",
        ] as $text) {
            $events = app(ArticleMosTimeline::class)->scan($text, [$speaker]);
            $this->assertCount(1, $events);
            $this->assertSame('Atunci vă rog să menționați ce dovezi', $events[0]['snippet']);
        }
    }
}
