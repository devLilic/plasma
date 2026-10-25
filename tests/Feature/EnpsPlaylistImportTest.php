<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\Playlist;
use App\Models\User;
use App\Services\Images\ImageMatcher;
use App\Services\Playlists\EnpsPlaylistAdapter;
use App\Services\Playlists\PlaylistTitleExclusions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class EnpsPlaylistImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Http::preventStrayRequests();
        $this->actingAs(User::factory()->create());
    }

    public function test_page_load_never_contacts_enps_and_catalog_requires_authentication(): void
    {
        Http::fake();
        $this->get('/playlists')->assertOk();
        Http::assertNothingSent();
        auth()->logout();
        $this->postJson('/playlists/enps/catalog')->assertUnauthorized();
        $this->postJson('/playlists/enps/import')->assertUnauthorized();
    }

    public function test_adapter_reads_begintext_and_preserves_collection_order_without_duplicating_the_body(): void
    {
        $articles = app(EnpsPlaylistAdapter::class)->articles($this->payload());
        $this->assertCount(2, $articles);
        $this->assertSame('MD MATERIAL OFF', $articles[0]->technical_title);
        $this->assertSame('MATERIAL', $articles[0]->search_slug);
        $this->assertSame('TITLU EDITORIAL', $articles[0]->title);
        $this->assertSame(['INTRO', 'SNC', 'OFF'], $articles[0]->types);
        $this->assertSame(['INTRO', 'SNC', 'OFF'], array_column($articles[0]->sections, 'type'));
        $this->assertSame(['Text intro.'], $articles[0]->sections[0]['paragraphs']);
        $this->assertSame(['Text sincron.'], $articles[0]->sections[1]['paragraphs']);
        $this->assertSame(['Text off.'], $articles[0]->sections[2]['paragraphs']);
        $this->assertSame('Text intro.', $articles[0]->content);
        $this->assertSame(['LIVE', 'BETA'], $articles[1]->types);
    }

    public function test_adapter_recognizes_standalone_segment_labels_and_literal_crlf(): void
    {
        $articles = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [
            ['ScriptOrder' => 1, 'RecordPointer' => ['ListData' => ['Title' => 'MD DRONA-INTRO', 'BeginText' => 'MD DRONA\\r\\nTITLU: DOUĂ DRONE\\r\\nINTRO: Text introductiv.\\r\\nBETA\\r\\nText beta.\\r\\nTEXT: Declarație.']]],
            ['ScriptOrder' => 2, 'RecordPointer' => ['ListData' => ['Title' => 'MD DRONA-BETA', 'BeginText' => 'BETA\\r\\nText beta.']]],
        ]]);
        $this->assertSame('DOUĂ DRONE', $articles[0]->title);
        $this->assertSame('Text introductiv.', $articles[0]->content);
        $this->assertSame(['INTRO', 'BETA', 'TEXT'], array_column($articles[0]->sections, 'type'));
        $this->assertSame(['Text beta.'], $articles[0]->sections[1]['paragraphs']);
    }

    public function test_real_helsinki_intro_stops_at_bare_off_and_uses_the_intro_record(): void
    {
        $source = json_decode(file_get_contents(base_path('tests/Fixtures/enps/maia-helsinki.json')), true, flags: JSON_THROW_ON_ERROR);
        $articles = app(EnpsPlaylistAdapter::class)->articles($source);

        $this->assertCount(1, $articles);
        $this->assertSame(['INTRO', 'OFF'], $articles[0]->types);
        $this->assertSame(['INTRO', 'OFF'], array_column($articles[0]->sections, 'type'));
        $this->assertSame('Şeful statului Maia Sandu a fost primită astăzi la Palatul Prezidențial din Helsinki de președintele Finlandei, Alexander Stubb. Cei doi șefi de stat vor discuta despre relațiile bilaterale, securitatea europeană și procesul de aderare la Uniunea Europeană.', $articles[0]->content);
        $this->assertCount(1, $articles[0]->sections[0]['paragraphs']);
        $this->assertStringNotContainsString("\u{00A0}", $articles[0]->content);
        $this->assertStringContainsString('Helsinki Security Forum', implode(' ', $articles[0]->sections[1]['paragraphs']));
        $this->assertStringContainsString('(Iuşi Hala Aho)', implode(' ', $articles[0]->sections[1]['paragraphs']));
    }

    public function test_intro_ends_at_each_block_marker_with_or_without_a_colon(): void
    {
        foreach (['BETA', 'OFF', 'LIVE', 'SNC', 'SINCRON', 'AMB', 'TEASE', 'FAKE', 'TEXT'] as $marker) {
            foreach (["{$marker}: Text de bloc.", "{$marker}\nText de bloc.", "{$marker}\u{00A0}Text de bloc."] as $block) {
                $articles = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [
                    ['ScriptOrder' => 1, 'RecordPointer' => ['ListData' => ['Title' => 'MD TEST-INTRO', 'BeginText' => "Text introductiv.\n{$block}"]]],
                ]]);
                $this->assertSame('Text introductiv.', $articles[0]->content, $block);
                $this->assertSame(['INTRO', $marker], array_column($articles[0]->sections, 'type'), $block);
                $this->assertSame(['Text de bloc.'], $articles[0]->sections[1]['paragraphs'], $block);
            }
        }
    }

    public function test_editorial_lines_flow_as_paragraphs_without_control_spacing_or_false_markers(): void
    {
        $articles = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [
            ['ScriptOrder' => 1, 'RecordPointer' => ['ListData' => ['Title' => 'MD TEST-INTRO', 'BeginText' => "INTRO:\r\nHelsinki\u{00A0}și\u{202F}Finlanda\u{2007}au relații.\nDis\u{00AD}cu\u{200B}tă astăzi.\n\nOFFICIAL nu este un marcaj.\nEmisiunea LIVE este în program.\nLive este un cuvânt în text.\nLIVE: Text live."]]],
        ]]);
        $this->assertSame(['Helsinki și Finlanda au relații. Discută astăzi.', 'OFFICIAL nu este un marcaj. Emisiunea LIVE este în program. Live este un cuvânt în text.'], $articles[0]->sections[0]['paragraphs']);
        $this->assertSame(['Text live.'], $articles[0]->sections[1]['paragraphs']);
    }

    public function test_capped_beta_preview_uses_verified_complete_text_and_preserves_the_end_of_the_story(): void
    {
        $source = json_decode(file_get_contents(base_path('tests/Fixtures/enps/truncated-beta.json')), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame(1000, mb_strlen($source['CollectionScripts'][1]['RecordPointer']['ListData']['BeginText']));
        $article = app(EnpsPlaylistAdapter::class)->articles($source)[0];
        $body = implode("\n\n", array_merge(...array_column($article->sections, 'paragraphs')));
        $this->assertSame(['INTRO', 'BETA'], $article->types);
        $this->assertStringContainsString('crater cu o adancime de un metru', $body);
        $this->assertStringContainsString('Cinci incidente, raportate și fixate', $body);
        $this->assertStringContainsString('Eu cred că a venit timpul să discutăm în serios', $body);
        $this->assertStringContainsString('drone rusești au intrat în spațiul aerian al ţării de peste 45 de ori', $body);
        $this->assertStringEndsWith('își modernizează armata.', $body);
        $this->assertStringContainsString('între orele 7:45 - 8:00', $body);
        foreach (['8074', '8037', 'STAND UP', 'BRUT', '00 01', '00 20', '0 22', '0 40', 'T.C.', '03.03', '03.20', '03.27', '03.36'] as $technical) {
            $this->assertStringNotContainsString($technical, $body);
        }
        $this->assertSame(str_replace("\u{00A0}", ' ', $source['CollectionScripts'][0]['RecordPointer']['ListData']['BeginText']), $article->content);
    }

    public function test_basic_complete_text_is_only_used_when_it_extends_the_same_rundown_preview(): void
    {
        foreach ([
            ['BETA: Preview.', 'BETA: Alt text mai lung.', 'Preview.'],
            ['BETA: Text complet.', 'BETA: Text', 'Text complet.'],
            ['BETA: Preview.', '', 'Preview.'],
            ['BETA: Preview.', ['invalid'], 'Preview.'],
            ['', 'BETA: Alt text mai lung.', ''],
        ] as [$preview, $full, $expected]) {
            $article = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [[
                'RecordPointer' => ['ListData' => ['Title' => 'MD TEST-BETA', 'BeginText' => $preview, 'Approved' => false]],
                'BasicContent' => ['ListData' => ['Title' => 'Alt titlu', 'Approved' => true], 'ObjectProperties' => [['FieldName' => 'Text', 'FieldValue' => $full]]],
            ]]])[0];
            $this->assertSame($expected === '' ? [] : [$expected], $article->sections[0]['paragraphs'] ?? []);
            $this->assertSame('MD TEST', $article->title);
            $this->assertSame($preview === '' ? 'yellow' : 'red', $article->enps_marker_color);
        }
    }

    public function test_technical_cleanup_keeps_speech_on_the_same_line_and_after_production_metadata(): void
    {
        $body = "INTRO: Intro.\nBETA: Începutul integral.\nDetalii https://example.test/clip și continuarea aceleiași fraze.\n\\\\server\\clip.mov Text după calea fișierului.\nC:\\clips\\clip.mov Continuare după calea locală.\nSTAND UP REPORTER\n8074 clip\n00 01 Declarația integrală despre cei 45 de kilometri. 00 20\nT.C. 03.03 -03.20 musca 03.27 - 03.36 Eu cred că trebuie să păstrăm întregul citat.\n00:05 - 00:11\nFinalul după toate marcajele.\nÎntre orele 7:45 - 8:00 au fost cinci incidente.\n2026 este anul discutat în text.\nBrut este un cuvânt în această frază.\nSursa (https://example.test/clip). Continuare după link.";
        $article = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [[
            'RecordPointer' => ['ListData' => ['Title' => 'MD TEST-BETA', 'BeginText' => $body]],
        ]]])[0];
        $text = implode(' ', $article->sections[1]['paragraphs']);
        foreach (['Începutul integral.', 'Detalii și continuarea aceleiași fraze.', 'Text după calea fișierului.', 'Continuare după calea locală.', 'Declarația integrală despre cei 45 de kilometri.', 'Eu cred că trebuie să păstrăm întregul citat.', 'Finalul după toate marcajele.', '7:45 - 8:00', '2026 este anul discutat în text.', 'Brut este un cuvânt în această frază.', 'Sursa . Continuare după link.'] as $speech) {
            $this->assertStringContainsString($speech, $text);
        }
        foreach (['https://', '\\\\server', 'C:\\clips', '8074', '00 01', '00 20', '03.03', '03.36', '00:05', 'STAND UP'] as $technical) {
            $this->assertStringNotContainsString($technical, $text);
        }
    }

    public function test_adapter_maps_enps_marker_from_content_and_approval(): void
    {
        $articles = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [
            ['ScriptOrder' => 1, 'RecordPointer' => [
                'ObjectProperties' => [
                    ['FieldName' => 'Text', 'FieldValue' => ''],
                    ['FieldName' => 'Approved', 'FieldValue' => false],
                ],
                'ListData' => ['Title' => 'RO ELEMENT GOL-INTRO', 'BeginText' => null, 'Approved' => false],
            ]],
            ['ScriptOrder' => 2, 'RecordPointer' => [
                'ObjectProperties' => [['FieldName' => 'Approved', 'FieldValue' => false]],
                'ListData' => ['Title' => 'RO ELEMENT ROSU-INTRO', 'BeginText' => 'INTRO: Text neaprobat.', 'Approved' => false],
            ]],
            ['ScriptOrder' => 3, 'RecordPointer' => [
                'ObjectProperties' => [['FieldName' => 'Approved', 'FieldValue' => true]],
                'ListData' => ['Title' => 'RO ELEMENT VERDE-INTRO', 'BeginText' => 'INTRO: Text aprobat.', 'Approved' => true],
            ]],
        ]]);

        $this->assertSame(['yellow', 'red', 'green'], array_map(fn ($article) => $article->enps_marker_color, $articles));
    }

    public function test_adapter_cleans_duplicate_sections_and_maps_unmarked_text_to_intro(): void
    {
        $body = "MD SCRIPT\r\nTITLU: Titlu editorial\r\nINTRO:\r\nIntroducere păstrată.\r\nBETA:\r\nText beta păstrat.\r\n\\\\10.10.87.17\\Reporter_Stiri\\OCTOMBRIE\\01\\clip.mov\r\n491_9863\r\n00:05 - 00:11\r\n.\r\nOFF:\r\nText off păstrat.";
        $articles = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [
            ['ScriptOrder' => 1, 'RecordPointer' => ['ListData' => ['Title' => 'MD TEST-INTRO', 'BeginText' => $body]]],
            ['ScriptOrder' => 2, 'RecordPointer' => ['ListData' => ['Title' => 'MD TEST-BETA', 'BeginText' => $body]]],
            ['ScriptOrder' => 3, 'RecordPointer' => ['ListData' => ['Title' => 'RO FĂRĂ MARCAJ-OFF', 'BeginText' => 'MD FĂRĂ MARCAJ\r\nTITLU: Ignorat\r\nText fără marcaje.']]],
        ]]);

        $this->assertSame(['INTRO', 'BETA', 'OFF'], array_column($articles[0]->sections, 'type'));
        $this->assertSame(['Introducere păstrată.'], $articles[0]->sections[0]['paragraphs']);
        $this->assertSame(['Text beta păstrat.'], $articles[0]->sections[1]['paragraphs']);
        $this->assertSame(['Text off păstrat.'], $articles[0]->sections[2]['paragraphs']);
        $this->assertSame('Introducere păstrată.', $articles[0]->content);
        $this->assertSame(['INTRO'], array_column($articles[1]->sections, 'type'));
        $this->assertSame(['Text fără marcaje.'], $articles[1]->sections[0]['paragraphs']);
    }

    public function test_catalog_connects_from_env_configuration_only_when_opened(): void
    {
        config(['services.enps.url' => 'http://enps.test/web/', 'services.enps.username' => 'test', 'services.enps.password' => 'secret-password', 'services.enps.domain' => '']);
        Http::fake(function (Request $request) {
            if ($request->url() === 'http://enps.test/web/') {
                return Http::response('<script>var serverConfig={"serviceAddress":"http://enps.test/json"};</script>');
            }
            if (str_ends_with($request->url(), '/api/IsAlive')) {
                return Http::response(['status' => true]);
            }
            if (str_ends_with($request->url(), '/api/Logon')) {
                return Http::response(['UserID' => 'TEST', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'login-secret']);
            }
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [['ListData' => ['Title' => 'Jurnal', 'Guid' => 'guid', 'Path' => 'P_NEWS\\W', 'Type' => 2]]]]);
            }

            return Http::response(['status' => true]);
        });
        $this->postJson('/playlists/enps/catalog')->assertOk()->assertJsonPath('playlists.0.title', 'Jurnal')->assertDontSee('login-secret')->assertDontSee('secret-password');
        $this->assertNotNull(session('enps_web.tokens'));
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Logon'));
    }

    public function test_incomplete_configuration_and_transport_timeout_are_safe(): void
    {
        config(['services.enps.username' => null]);
        Http::fake();
        $this->postJson('/playlists/enps/catalog')->assertUnprocessable()->assertJsonPath('error.kind', 'configuration');
        Http::assertNothingSent();
        $this->activeSession();
        Http::fake(['http://enps.test/json/api/*' => fn () => throw new ConnectionException('operation timed out with private data')]);
        $this->postJson('/playlists/enps/import', $this->selection())->assertServiceUnavailable()->assertJsonPath('error.kind', 'timeout')->assertDontSee('private data');
        $this->assertDatabaseCount('playlists', 0);
    }

    public function test_import_creates_a_local_playlist_and_rotates_encrypted_session_tokens(): void
    {
        $image = Image::create(['url' => 'library/material.jpg']);
        $previous = Playlist::create(['title' => 'Anterior']);
        $previous->articles()->create(['title' => 'Vechi', 'subtitle' => 'MATERIAL', 'article_type' => 'OFF', 'playlist_order' => 1, 'image_id' => $image->id]);
        $this->activeSession();
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $this->payload(), ['X-ENPS-TOKEN' => 'rotated-secret', 'Authorization' => 'Exact rotated-secret']));
        $response = $this->postJson('/playlists/enps/import', $this->selection());
        $response->assertCreated()->assertJsonStructure(['playlist' => ['id', 'title', 'url']])->assertDontSee('rotated-secret')->assertDontSee('BeginText');
        $playlist = Playlist::findOrFail($response->json('playlist.id'));
        $this->assertSame('enps', $playlist->source_type);
        $this->assertSame('NEWS', $playlist->source_enps_database);
        $this->assertSame(2, $playlist->articles()->count());
        $this->assertSame($image->id, $playlist->articles()->orderBy('playlist_order')->first()->image_id);
        $this->assertSame(['INTRO', 'SNC', 'OFF'], $playlist->articles()->orderBy('playlist_order')->first()->article_types);
        $this->assertSame('red', $playlist->articles()->orderBy('playlist_order')->first()->enps_marker_color);
        Storage::disk('local')->assertExists($playlist->source_enps_snapshot_path);
        $this->assertSame('rotated-secret', json_decode(Crypt::decryptString(session('enps_web.tokens')), true)['nom']);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent?') && str_contains($request->url(), 'returnText=true') && $request->hasHeader('X-ENPS-TOKEN', 'session-secret'));
        $this->assertCount(4, Http::recorded(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?')));
        $this->assertSame(4, $playlist->enpsItems()->count());
        $this->assertStringNotContainsString('rotated-secret', Storage::disk('local')->get($playlist->source_enps_snapshot_path));
    }

    public function test_import_applies_saved_excluded_titles_to_entire_enps_stories(): void
    {
        app(PlaylistTitleExclusions::class)->save(['generic in']);
        $this->activeSession();
        $payload = $this->payload();
        $excludedText = "GENERIC IN\r\nINTRO: Intro tehnic.\r\nBETA: Text tehnic.";
        $payload['CollectionScripts'][] = ['ScriptOrder' => 6, 'RecordPointer' => ['ListData' => ['Title' => 'MD GENERIC IN-INTRO', 'BeginText' => $excludedText]]];
        $payload['CollectionScripts'][] = ['ScriptOrder' => 7, 'RecordPointer' => ['ListData' => ['Title' => 'MD GENERIC IN-BETA', 'BeginText' => $excludedText]]];
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $payload));

        $response = $this->postJson('/playlists/enps/import', $this->selection())->assertCreated();
        $playlist = Playlist::findOrFail($response->json('playlist.id'));

        $this->assertSame(2, $playlist->articles()->count());
        $this->assertDatabaseMissing('articles', ['title' => 'MD GENERIC IN']);
        $this->assertSame(['MD MATERIAL OFF', 'RO VOT'], $playlist->articles()->orderBy('playlist_order')->pluck('technical_title')->all());
    }

    public function test_refresh_parsing_reapplies_updated_title_exclusions_to_an_existing_enps_playlist(): void
    {
        app(PlaylistTitleExclusions::class)->save([]);
        $this->activeSession();
        $payload = $this->payload();
        $payload['CollectionScripts'][] = ['ScriptOrder' => 6, 'RecordPointer' => ['ListData' => ['Title' => 'MD GENERIC IN-INTRO', 'BeginText' => 'INTRO: Material tehnic.']]];
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $payload));

        $response = $this->postJson('/playlists/enps/import', $this->selection())->assertCreated();
        $playlist = Playlist::findOrFail($response->json('playlist.id'));
        $this->assertSame(3, $playlist->articles()->count());

        app(PlaylistTitleExclusions::class)->save(['GENERIC IN']);
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $payload));
        $this->post(route('playlists.refresh-parsing', $playlist))->assertRedirect(route('playlists.show', $playlist))->assertSessionHasNoErrors();

        $this->assertSame(2, $playlist->articles()->count());
        $this->assertDatabaseMissing('articles', ['playlist_id' => $playlist->id, 'technical_title' => 'MD GENERIC IN']);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent?') && $request->hasHeader('X-ENPS-TOKEN', 'session-secret'));
    }

    public function test_duplicates_return_existing_choices_and_copy_or_retries_are_explicit(): void
    {
        $this->activeSession();
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $this->payload()));
        $requestId = (string) Str::uuid();
        $first = $this->postJson('/playlists/enps/import', [...$this->selection(), 'requestId' => $requestId])->assertCreated();
        $this->postJson('/playlists/enps/import', [...$this->selection(), 'requestId' => $requestId])->assertOk()->assertJsonPath('playlist.id', $first->json('playlist.id'));
        $this->postJson('/playlists/enps/import', $this->selection())->assertConflict()->assertJsonPath('duplicate.id', $first->json('playlist.id'));
        $this->postJson('/playlists/enps/import', [...$this->selection(), 'copy' => true, 'requestId' => (string) Str::uuid()])->assertCreated();
        $this->assertSame(2, Playlist::count());
        Http::assertSentCount(10);
    }

    public function test_expired_and_foreign_sessions_never_create_a_playlist(): void
    {
        Http::fake(fn () => Http::response(['private' => 'never expose'], 401));
        $this->postJson('/playlists/enps/import', $this->selection())->assertUnauthorized()->assertJsonPath('error.kind', 'expired');
        $this->activeSession();
        $this->postJson('/playlists/enps/import', ['guid' => 'foreign', 'path' => 'P_NEWS\\W'])->assertUnprocessable();
        Http::assertNothingSent();
        $this->postJson('/playlists/enps/import', $this->selection())->assertUnauthorized()->assertJsonPath('error.kind', 'expired')->assertDontSee('never expose');
        $this->assertNull(session('enps_web.tokens'));
        $this->assertSame(0, Playlist::count());
    }

    public function test_empty_enps_rows_and_missing_begintext_do_not_block_playlist_import(): void
    {
        $this->activeSession();
        $payload = $this->payload();
        unset($payload['CollectionScripts'][0]['RecordPointer']['ListData']['BeginText']);
        $payload['CollectionScripts'][] = [
            'ScriptOrder' => 6,
            'PageNum' => '3',
            'RecordPointer' => [
                'ObjectProperties' => [
                    ['FieldName' => 'Approved', 'FieldValue' => false],
                    ['FieldName' => 'Status', 'FieldValue' => '2'],
                ],
                'ListData' => [
                    'Title' => 'HEADLINES-BETA',
                    'Approved' => false,
                    'BeginText' => null,
                ],
            ],
        ];
        $payload['CollectionScripts'][] = ['ScriptOrder' => 7, 'RecordPointer' => []];
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $payload));
        $response = $this->postJson('/playlists/enps/import', $this->selection())->assertCreated();
        $playlist = Playlist::findOrFail($response->json('playlist.id'));

        $this->assertSame(3, $playlist->articles()->count());
        $emptyArticle = $playlist->articles()->where('technical_title', 'HEADLINES')->firstOrFail();
        $this->assertSame('', $emptyArticle->intro);
        $this->assertSame([], $emptyArticle->content_sections);
        $snapshot = json_decode(Storage::disk('local')->get($playlist->source_enps_snapshot_path), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('', $snapshot['CollectionScripts'][0]['RecordPointer']['ListData']['BeginText']);
    }

    public function test_persistence_failure_rolls_back_and_deletes_the_staged_snapshot(): void
    {
        $this->activeSession();
        Http::fake(fn (Request $request) => $this->enpsResponse($request, $this->payload()));
        $this->mock(ImageMatcher::class)->shouldReceive('bestMatch')->andThrow(new \RuntimeException('sensitive exception'));
        $this->postJson('/playlists/enps/import', $this->selection())->assertServiceUnavailable()->assertDontSee('sensitive exception');
        $this->assertDatabaseCount('playlists', 0);
        $this->assertDatabaseCount('articles', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('playlist-enps-sources'));
    }

    public function test_refresh_reads_latest_enps_content_and_deletion_removes_snapshot(): void
    {
        $this->activeSession();
        $currentPayload = $this->payload();
        Http::fake(function (Request $request) use (&$currentPayload) {
            return $this->enpsResponse($request, $currentPayload);
        });
        $response = $this->postJson('/playlists/enps/import', $this->selection())->assertCreated();
        $playlist = Playlist::findOrFail($response->json('playlist.id'));
        $article = $playlist->articles()->first();
        $image = Image::create(['url' => 'library/preserved.jpg']);
        $article->update(['image_id' => $image->id, 'title' => 'EDITAT']);
        $updatedPayload = $this->payload();
        $updatedBody = "MD MATERIAL OFF\r\nTITLU: TITLU EDITORIAL\r\nINTRO: Intro actualizat din ENPS.\r\nOFF: Text off.";
        foreach ([0, 1, 2] as $index) {
            $updatedPayload['CollectionScripts'][$index]['RecordPointer']['ListData']['BeginText'] = $updatedBody;
        }
        $currentPayload = $updatedPayload;
        $this->post(route('playlists.refresh-parsing', $playlist))->assertRedirect(route('playlists.show', $playlist))->assertSessionHasNoErrors();
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent?') && str_contains($request->url(), 'returnText=true'));
        $freshPlaylist = $playlist->fresh();
        $this->assertStringContainsString('Intro actualizat din ENPS.', Storage::disk('local')->get($freshPlaylist->source_enps_snapshot_path));
        $this->assertSame('Intro actualizat din ENPS.', $article->fresh()->intro);
        $this->assertSame($image->id, $article->fresh()->image_id);
        $path = $freshPlaylist->source_enps_snapshot_path;
        Storage::disk('local')->assertExists($path);
        $requestCount = Http::recorded()->count();
        $this->delete(route('playlists.destroy', $playlist))->assertRedirect('/playlists');
        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseHas('images', ['id' => $image->id]);
        Http::assertSentCount($requestCount);
    }

    public function test_refresh_authenticates_when_session_is_missing_then_reimports_and_filters_current_enps_content(): void
    {
        config(['services.enps.url' => 'http://enps.test/web/', 'services.enps.username' => 'test-user', 'services.enps.password' => 'private-password', 'services.enps.domain' => '']);
        app(PlaylistTitleExclusions::class)->save(['GENERIC IN']);
        $oldSnapshotPath = 'playlist-enps-sources/old.json';
        Storage::disk('local')->put($oldSnapshotPath, json_encode($this->payload()));
        $playlist = Playlist::create([
            'title' => 'Jurnal',
            'source_type' => 'enps',
            'source_enps_database' => 'NEWS',
            'source_enps_path' => 'P_NEWS\\W',
            'source_enps_guid' => 'guid',
            'source_enps_snapshot_path' => $oldSnapshotPath,
        ]);
        $image = Image::create(['url' => 'library/preserved.jpg']);
        $playlist->articles()->create(['title' => 'Material', 'subtitle' => 'MATERIAL', 'technical_title' => 'MD MATERIAL OFF', 'slugs' => 'MD MATERIAL OFF-INTRO||MD MATERIAL OFF-SNC||MD MATERIAL OFF-OFF', 'intro' => 'Intro vechi.', 'article_type' => 'OFF', 'article_types' => ['INTRO', 'SNC', 'OFF'], 'playlist_order' => 1, 'image_id' => $image->id]);
        $playlist->articles()->create(['title' => 'Vot', 'subtitle' => 'VOT', 'technical_title' => 'RO VOT', 'slugs' => 'RO VOT-LIVE||RO VOT-BETA', 'article_type' => 'BETA', 'playlist_order' => 2]);
        $playlist->articles()->create(['title' => 'Vechi', 'subtitle' => 'VECHI', 'technical_title' => 'MD VECHI', 'slugs' => 'MD VECHI-INTRO', 'article_type' => 'BETA', 'playlist_order' => 3]);

        $payload = $this->payload();
        $payload['CollectionScripts'][0]['ScriptOrder'] = 4;
        $payload['CollectionScripts'][1]['ScriptOrder'] = 3;
        $payload['CollectionScripts'][2]['ScriptOrder'] = 5;
        $payload['CollectionScripts'][3]['ScriptOrder'] = 1;
        $payload['CollectionScripts'][4]['ScriptOrder'] = 2;
        $updatedBody = "MD MATERIAL OFF\r\nTITLU: TITLU EDITORIAL\r\nINTRO: Introducere actualizată.\r\nOFF: Text off actualizat.";
        foreach ([0, 1, 2] as $index) {
            $payload['CollectionScripts'][$index]['RecordPointer']['ListData']['BeginText'] = $updatedBody;
        }
        $payload['CollectionScripts'][] = ['ScriptOrder' => 6, 'RecordPointer' => ['ListData' => ['Title' => 'MD NOU-INTRO', 'BeginText' => 'INTRO: Story nou.']]];
        $payload['CollectionScripts'][] = ['ScriptOrder' => 7, 'RecordPointer' => ['ListData' => ['Title' => 'MD GENERIC IN-INTRO', 'BeginText' => 'INTRO: Story exclus.']]];

        Http::fake(function (Request $request) use ($payload) {
            if ($request->url() === 'http://enps.test/web/') {
                return Http::response('<script>var serverConfig={"serviceAddress":"http://enps.test/json"};</script>');
            }
            if (str_ends_with($request->url(), '/api/Logon')) {
                return Http::response(['UserID' => 'TEST', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'login-token']);
            }
            if (str_contains($request->url(), '/api/RundownContent?')) {
                return $this->enpsResponse($request, $payload, ['X-ENPS-TOKEN' => 'rundown-token']);
            }
            if (str_contains($request->url(), '/api/BasicContent?')) {
                return $this->enpsResponse($request, $payload);
            }
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [['ListData' => ['Title' => 'Jurnal', 'Guid' => 'guid', 'Path' => 'P_NEWS\\W', 'Type' => 2]]]]);
            }

            return Http::response(['status' => true]);
        });

        $this->post(route('playlists.refresh-parsing', $playlist))->assertRedirect(route('playlists.show', $playlist));

        $playlist->refresh();
        $this->assertSame(['VOT', 'MATERIAL', 'NOU'], $playlist->articles()->orderBy('playlist_order')->pluck('subtitle')->all());
        $this->assertSame('Introducere actualizată.', $playlist->articles()->where('subtitle', 'MATERIAL')->value('intro'));
        $this->assertSame($image->id, $playlist->articles()->where('subtitle', 'MATERIAL')->value('image_id'));
        $this->assertDatabaseMissing('articles', ['playlist_id' => $playlist->id, 'subtitle' => 'VECHI']);
        $this->assertDatabaseMissing('articles', ['playlist_id' => $playlist->id, 'subtitle' => 'GENERIC IN']);
        Storage::disk('local')->assertMissing($oldSnapshotPath);
        Storage::disk('local')->assertExists($playlist->source_enps_snapshot_path);
        $this->assertSame('rundown-token', json_decode(Crypt::decryptString(session('enps_web.tokens')), true)['nom']);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Logon'));
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent?') && str_contains($request->url(), 'returnText=true') && $request->hasHeader('X-ENPS-TOKEN', 'login-token'));
        Http::assertSentCount(11);
    }

    public function test_refresh_reauthenticates_after_an_expired_enps_ping(): void
    {
        config(['services.enps.url' => 'http://enps.test/web/', 'services.enps.username' => 'test-user', 'services.enps.password' => 'private-password', 'services.enps.domain' => '']);
        $playlist = Playlist::create(['title' => 'Jurnal', 'source_type' => 'enps', 'source_enps_database' => 'NEWS', 'source_enps_path' => 'P_NEWS\\W', 'source_enps_guid' => 'guid']);
        $this->activeSession();
        $pingCount = 0;
        Http::fake(function (Request $request) use (&$pingCount) {
            if ($request->url() === 'http://enps.test/web/') {
                return Http::response('<script>var serverConfig={"serviceAddress":"http://enps.test/json"};</script>');
            }
            if (str_ends_with($request->url(), '/api/Logon')) {
                return Http::response(['UserID' => 'TEST', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'new-login-token']);
            }
            if (str_ends_with($request->url(), '/api/Ping') && ++$pingCount === 1) {
                return Http::response(['private' => 'expired'], 401);
            }
            if (str_contains($request->url(), '/api/RundownContent?')) {
                return $this->enpsResponse($request, $this->payload());
            }
            if (str_contains($request->url(), '/api/BasicContent?')) {
                return $this->enpsResponse($request, $this->payload());
            }
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [['ListData' => ['Title' => 'Jurnal', 'Guid' => 'guid', 'Path' => 'P_NEWS\\W', 'Type' => 2]]]]);
            }

            return Http::response(['status' => true]);
        });

        $this->post(route('playlists.refresh-parsing', $playlist))->assertRedirect(route('playlists.show', $playlist))->assertSessionHasNoErrors();

        $this->assertSame(2, $pingCount);
        $this->assertSame(2, $playlist->articles()->count());
        $this->assertSame('new-login-token', json_decode(Crypt::decryptString(session('enps_web.tokens')), true)['nom']);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Logon'));
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent?') && $request->hasHeader('X-ENPS-TOKEN', 'new-login-token'));
    }

    public function test_refresh_failure_leaves_existing_articles_and_snapshot_untouched(): void
    {
        $this->activeSession();
        Http::fake(function (Request $request) {
            if (str_contains($request->url(), '/api/RundownContent?')) {
                throw new ConnectionException('operation timed out with private data');
            }

            return Http::response(['status' => true]);
        });
        $oldSnapshotPath = 'playlist-enps-sources/unchanged.json';
        $oldSnapshot = json_encode($this->payload(), JSON_THROW_ON_ERROR);
        Storage::disk('local')->put($oldSnapshotPath, $oldSnapshot);
        $playlist = Playlist::create([
            'title' => 'Jurnal',
            'source_type' => 'enps',
            'source_enps_database' => 'NEWS',
            'source_enps_path' => 'P_NEWS\\W',
            'source_enps_guid' => 'guid',
            'source_enps_snapshot_path' => $oldSnapshotPath,
        ]);
        $article = $playlist->articles()->create(['title' => 'Local', 'subtitle' => 'LOCAL', 'technical_title' => 'MD LOCAL', 'article_type' => 'OFF', 'playlist_order' => 1]);

        $this->from(route('playlists.show', $playlist))->post(route('playlists.refresh-parsing', $playlist))
            ->assertRedirect(route('playlists.show', $playlist))
            ->assertSessionHasErrors('playlist');

        $this->assertSame('Local', $article->fresh()->title);
        $this->assertSame(1, $playlist->articles()->count());
        $this->assertSame($oldSnapshot, Storage::disk('local')->get($oldSnapshotPath));
        $this->assertSame([$oldSnapshotPath], Storage::disk('local')->allFiles('playlist-enps-sources'));
    }

    public function test_catalog_uses_active_session_and_reports_existing_imports_without_secrets(): void
    {
        $this->activeSession();
        Playlist::create(['title' => 'Local', 'source_type' => 'enps', 'source_enps_database' => 'NEWS', 'source_enps_path' => 'P_NEWS\\W', 'source_enps_guid' => 'guid']);
        Http::fake(function (Request $request) {
            if (str_ends_with($request->url(), '/api/Ping')) {
                return Http::response(['status' => true], 200, ['X-ENPS-TOKEN' => 'updated-secret']);
            }

            return Http::response(['Records' => [['ListData' => ['Title' => 'Jurnal', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'guid']]]]);
        });
        $this->postJson('/playlists/enps/catalog')->assertOk()->assertJsonPath('playlists.0.existingPlaylist.title', 'Local')->assertDontSee('secret');
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '/api/Logon'));
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Lists') && $request->hasHeader('X-ENPS-TOKEN', 'updated-secret'));
    }

    private function enpsResponse(Request $request, array $payload, array $headers = [])
    {
        foreach ($payload['CollectionScripts'] as &$script) {
            if (! is_array($script['RecordPointer']['ListData'] ?? null)) {
                continue;
            }
            $data = &$script['RecordPointer']['ListData'];
            $data['Guid'] ??= md5($data['Title']);
            $data['Path'] ??= 'P_NEWS\\W\\R_playlist';
            $data['ENPSDatabase'] ??= 'NEWS';
            unset($data);
        }
        unset($script);
        if (str_contains($request->url(), '/api/BasicContent?')) {
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);
            foreach ($payload['CollectionScripts'] as $script) {
                $data = $script['RecordPointer']['ListData'] ?? [];
                if (($data['Guid'] ?? null) === $query['guid']) {
                    return Http::response(['ListData' => $data, 'ObjectProperties' => []], 200, $headers);
                }
            }

            return Http::response([], 404);
        }

        return Http::response($payload, 200, $headers);
    }

    private function activeSession(): void
    {
        $this->withSession(['enps_web' => [
            'state' => ['user' => 'TEST', 'homeDatabase' => 'NEWS', 'homeProgram' => 'NEWS', 'globalTables' => [], 'playlists' => [['title' => 'Jurnal', 'path' => 'P_NEWS\\W', 'guid' => 'guid', 'workAt' => '30.09.2026, 13:00']], 'serviceAddress' => 'http://enps.test/json', 'verifiedAt' => now()->toIso8601String()],
            'tokens' => Crypt::encryptString(json_encode(['nom' => 'session-secret', 'authorization' => 'Exact authorization-secret'])),
            'cookies' => Crypt::encryptString('[]'),
        ]]);
    }

    private function selection(): array
    {
        return ['path' => 'P_NEWS\\W', 'guid' => 'guid'];
    }

    private function payload(): array
    {
        $text = "MD MATERIAL OFF\r\nTITLU: TITLU EDITORIAL\r\nINTRO: Text intro.\r\nSNC: Text sincron.\r\nOFF: Text off.";

        return ['CollectionScripts' => [
            ['ScriptOrder' => 3, 'RecordPointer' => ['ListData' => ['Title' => 'MD MATERIAL OFF-OFF', 'BeginText' => $text]]],
            ['ScriptOrder' => 1, 'RecordPointer' => ['ListData' => ['Title' => 'MD MATERIAL OFF-INTRO', 'BeginText' => $text]]],
            ['ScriptOrder' => 2, 'RecordPointer' => ['ListData' => ['Title' => 'MD MATERIAL OFF-SNC', 'BeginText' => $text]]],
            ['ScriptOrder' => 4, 'RecordPointer' => ['ListData' => ['Title' => 'RO VOT-LIVE', 'BeginText' => 'LIVE: În direct.']]],
            ['ScriptOrder' => 5, 'RecordPointer' => ['ListData' => ['Title' => 'RO VOT-BETA', 'BeginText' => 'BETA: Text beta.']]],
        ]];
    }
}
