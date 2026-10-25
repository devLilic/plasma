<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\Playlist;
use App\Models\PlaylistEnpsItem;
use App\Models\User;
use App\Services\Enps\EnpsBasicContent;
use App\Services\Playlists\EnpsPlaylistAdapter;
use App\Services\Playlists\PlaylistTitleExclusions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EnpsPlaylistBasicContentTest extends TestCase
{
    use RefreshDatabase;

    private array $scripts;

    private string $mosValue = 'Versiunea inițială';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Http::preventStrayRequests();
        $this->actingAs(User::factory()->create());
        $this->withSession(['enps_web' => [
            'state' => ['user' => 'TEST', 'homeDatabase' => 'NEWS', 'homeProgram' => 'NEWS', 'globalTables' => [], 'playlists' => [['title' => 'Jurnal', 'path' => 'P_NEWS\\W\\R_playlist', 'guid' => 'playlist-guid']], 'serviceAddress' => 'http://enps.test/json', 'verifiedAt' => now()->toIso8601String()],
            'tokens' => Crypt::encryptString(json_encode(['nom' => 'initial-token', 'authorization' => 'Bearer initial'])),
            'cookies' => Crypt::encryptString('[]'),
        ]]);
        $this->scripts = [$this->script(2, 'beta', 'MD MATERIAL-BETA'), $this->script(1, 'intro', 'MD MATERIAL-INTRO'), $this->script(3, 'excluded', 'GENERIC IN')];
        app(PlaylistTitleExclusions::class)->save(['GENERIC IN']);
    }

    public function test_real_basic_content_exposes_all_five_mos_blocks_and_editable_values(): void
    {
        // Real user response; only the embedded thumbnails were removed from the fixture.
        $content = json_decode(file_get_contents(base_path('tests/Fixtures/enps/basic-content.json')), true, 512, JSON_THROW_ON_ERROR);
        $objects = EnpsBasicContent::mosObjects($content);
        $this->assertCount(5, $objects);
        $this->assertSame('2bd76102-f797-43a8-93c6-7ca6876ca774', $objects[0]['commandId']);
        $this->assertSame('01_Titlu', $objects[0]['slug']);
        $this->assertSame([['type' => 'TEXT', 'name' => 'Titlu', 'value' => 'NIVELUL NISTRULUI S-A STABILIZAT LA STAŢIA COSĂUŢI']], $objects[0]['editableObjects']);
        $this->assertSame(['IGOR GROSU', 'SERGIU LAZARENCU', 'VASILE TARLEV', 'IGOR DODON'], array_map(fn ($object) => $object['editableObjects'][0]['value'], array_slice($objects, 1)));
        $this->assertSame('preşedintele Parlamentului Republicii Moldova', $objects[1]['editableObjects'][1]['value']);
    }

    public function test_mos_field_roles_normalize_case_and_unicode_spacing_without_guessing_other_fields(): void
    {
        foreach (['Titlu', ' TITLU ', "\u{00A0}tItLu\u{202F}"] as $name) {
            $this->assertSame('title', EnpsBasicContent::editableRole($name));
        }
        foreach (['Titlu scurt', ' TITLU   SCURT ', "\u{00A0}Titlu\u{00A0}\u{202F}scurt\u{2007}", "Titlu\tscurt"] as $name) {
            $this->assertSame('short_title', EnpsBasicContent::editableRole($name));
        }
        foreach (['NUME', 'Functie', 'Titlu secundar', 'Titlu scurt suplimentar', ''] as $name) {
            $this->assertSame('value', EnpsBasicContent::editableRole($name));
        }
    }

    public function test_saved_two_title_graphics_receive_roles_in_any_playlist_without_reimport_or_mutation(): void
    {
        $content = json_decode(file_get_contents(base_path('tests/Fixtures/enps/two-titles-basic-content.json')), true, flags: JSON_THROW_ON_ERROR);
        $objects = EnpsBasicContent::mosObjects($content);
        $this->assertCount(1, $objects);
        $this->assertSame('05_Titlu_Ultima_Ora', $objects[0]['slug']);
        $this->assertSame(['Titlu', 'Titlu scurt'], array_column($objects[0]['editableObjects'], 'name'));
        $this->assertSame(['RUSIA, APEL LA DIPLOMAŢI ŞI STRĂINI SĂ PĂRĂSEASCĂ KIEVUL', 'Kievul, ţinta moscovei'], array_column($objects[0]['editableObjects'], 'value'));

        foreach (['05_Titlu_Ultima_Ora', '05_Titlu_Ultima_Ora', 'Alta_Grafica_Doua_Titluri'] as $index => $slug) {
            $playlist = Playlist::create(['title' => 'Playlist '.($index + 1), 'source_type' => 'enps']);
            $object = $objects[0];
            $object['slug'] = $slug;
            if ($index > 0) {
                $object['editableObjects'] = [
                    ['type' => 'TEXT', 'name' => " TITLU\u{00A0}  SCURT ", 'value' => 'Titlu scurt '.$index],
                    ['type' => 'TEXT', 'name' => ' tItLu ', 'value' => 'Titlu obișnuit '.$index],
                    ['type' => 'TEXT', 'name' => 'Functie', 'value' => 'redactor'],
                ];
            }
            $article = $playlist->articles()->create([
                'title' => 'Știre '.$index, 'subtitle' => 'Știre '.$index, 'article_type' => 'OFF',
                'playlist_order' => 1, 'mos_objects' => [$object],
            ]);
            $stored = $article->getRawOriginal('mos_objects');
            $expected = array_map(fn ($field) => [...$field,
                'role' => EnpsBasicContent::editableRole($field['name']),
                'fieldKey' => null,
                'importedValue' => $field['value'],
                'isOverridden' => false,
                'sourceChanged' => false,
            ], $object['editableObjects']);
            $this->get(route('playlists.show', $playlist))->assertInertia(fn ($page) => $page
                ->where('articles.0.mos_objects.0.slug', $slug)
                ->where('articles.0.mos_objects.0.editableObjects', $expected));
            $this->assertSame($index === 0 ? ['title', 'short_title'] : ['short_title', 'title', 'value'], array_column($expected, 'role'));
            $this->assertSame($stored, $article->fresh()->getRawOriginal('mos_objects'));
            $this->assertDatabaseCount('playlist_enps_items', 0);
        }
        Http::assertNothingSent();
    }

    public function test_last_hour_short_title_is_imported_in_romanian_sentence_case(): void
    {
        $content = ['ObjectProperties' => [['FieldName' => 'TextCommands', 'FieldValue' => [
            'uppercase-title' => '<mos><itemSlug>05_Titlu_Ultima_Ora</itemSlug><editableObject type="TEXT"><name>Titlu scurt</name><value>ULTIMA ORĂ</value></editableObject></mos>',
            'mixed-case-title' => '<mos><itemSlug>05_Titlu_Ultima_Ora</itemSlug><editableObject type="TEXT"><name>Titlu scurt</name><value>Ultima orĂ</value></editableObject></mos>',
            'other-template' => '<mos><itemSlug>02_Nume</itemSlug><editableObject type="TEXT"><name>Titlu scurt</name><value>ULTIMA ORĂ</value></editableObject></mos>',
        ]]]];

        $objects = EnpsBasicContent::mosObjects($content);

        $this->assertSame(['Ultima oră', 'Ultima oră', 'ULTIMA ORĂ'], array_map(fn ($object) => $object['editableObjects'][0]['value'], $objects));
    }

    public function test_complete_html_script_preserves_editorial_text_and_omits_mos_html_metadata(): void
    {
        $text = EnpsBasicContent::editorialText(['ObjectProperties' => [['FieldName' => 'Text', 'FieldValue' => '<html><head><title>Technical title</title><style>Technical style</style></head><body><div class="MOS-SUMMARY"><div class="MOSInfo">CastaliaCG: 01_Titlu</div><div class="MOSDetails">Hidden XML</div></div><p>BETA: Text <strong>integral</strong>.</p><div>Continuarea finală.</div><script>secretCode()</script></body></html>']]]);
        $this->assertSame("\nBETA: Text integral.\n\nContinuarea finală.\n", $text);
        foreach (['Technical', 'CastaliaCG', 'Hidden XML', 'secretCode'] as $metadata) {
            $this->assertStringNotContainsString($metadata, $text);
        }
        $this->assertSame('', EnpsBasicContent::editorialText(['ObjectProperties' => [['FieldName' => 'Text', 'FieldValue' => ['invalid']]]]));
        Http::assertNothingSent();
    }

    public function test_import_and_refresh_restore_complete_beta_text_from_basic_content_and_keep_the_image(): void
    {
        $fixture = json_decode(file_get_contents(base_path('tests/Fixtures/enps/truncated-beta.json')), true, flags: JSON_THROW_ON_ERROR);
        $this->scripts = [$this->script(1, 'intro', 'MD DRONE SI RACHETE MOLDOVA-INTRO'), $this->script(2, 'beta', 'MD DRONE SI RACHETE MOLDOVA-BETA')];
        foreach ($this->scripts as $index => &$script) {
            $script['RecordPointer']['ListData']['BeginText'] = $fixture['CollectionScripts'][$index]['RecordPointer']['ListData']['BeginText'];
        }
        unset($script);
        $basic = $fixture['CollectionScripts'][1]['BasicContent'];
        Http::fake(function (Request $request) use ($basic) {
            if (str_contains($request->url(), '/api/BasicContent?')) {
                return Http::response([...$basic, 'ListData' => ['Guid' => 'beta']], 200, ['X-ENPS-TOKEN' => 'basic-beta']);
            }

            return $this->respond($request);
        });
        $playlist = $this->import();
        $article = $playlist->articles()->firstOrFail();
        $text = implode(' ', array_merge(...array_column($article->content_sections, 'paragraphs')));
        $this->assertStringEndsWith('își modernizează armata.', $text);
        $image = Image::create(['url' => 'library/preserved-beta.jpg']);
        $article->update(['image_id' => $image->id, 'content_sections' => [['type' => 'BETA', 'slug' => '', 'paragraphs' => ['Text vechi tăiat.']]]]);
        $this->post(route('playlists.refresh-parsing', $playlist))->assertSessionHasNoErrors();
        $article->refresh();
        $text = implode(' ', array_merge(...array_column($article->content_sections, 'paragraphs')));
        $this->assertStringEndsWith('își modernizează armata.', $text);
        $this->assertSame($image->id, $article->image_id);
        $this->assertStringContainsString('Eu cred că a venit timpul', $text);
        $this->assertStringNotContainsString('T.C.', $text);
        $this->assertCount(2, Http::recorded(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?')));
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'guid=intro'));
    }

    public function test_mos_values_follow_consecutive_story_groups_without_duplicating_shared_commands(): void
    {
        $content = json_decode(file_get_contents(base_path('tests/Fixtures/enps/basic-content.json')), true, 512, JSON_THROW_ON_ERROR);
        $beta = $this->script(2, 'beta', 'MD MATERIAL-BETA');
        $off = $this->script(3, 'off', 'MD MATERIAL-OFF');
        $beta['BasicContent'] = $content;
        $off['BasicContent'] = $content;
        $repeated = $this->script(5, 'other', 'MD MATERIAL-OFF');
        $repeated['BasicContent'] = ['ObjectProperties' => [['FieldName' => 'TextCommands', 'FieldValue' => [
            'other-command' => '[<mos><itemSlug>01_Titlu</itemSlug><mosExternalMetadata><mosPayload><editableObject type="TEXT"><name>Titlu</name><value>Alt titlu</value></editableObject></mosPayload></mosExternalMetadata></mos>]',
        ]]]];
        $articles = app(EnpsPlaylistAdapter::class)->articles(['CollectionScripts' => [
            $repeated, $off, $this->script(1, 'intro', 'MD MATERIAL-INTRO'), $beta,
            $this->script(4, 'separator', 'MD ALTA STIRE-OFF'),
        ]]);
        $this->assertCount(3, $articles);
        $this->assertCount(5, $articles[0]->mos_objects);
        $this->assertSame([], $articles[1]->mos_objects);
        $this->assertSame('Alt titlu', $articles[2]->mos_objects[0]['editableObjects'][0]['value']);
    }

    public function test_import_fetches_every_record_including_excluded_items_and_preserves_rundown_contracts(): void
    {
        $this->scripts[] = ['ScriptOrder' => 4, 'RecordPointer' => []];
        $this->scripts[] = ['ScriptOrder' => 5, 'RecordPointer' => ['ListData' => ['Guid' => '0', 'Title' => '', 'Type' => 0, 'ENPSDatabase' => '', 'Path' => '']]];
        Http::fake(fn (Request $request) => $this->respond($request));
        $playlist = $this->import();
        $items = $playlist->enpsItems()->get();
        $this->assertSame(['beta', 'excluded'], $items->pluck('source_guid')->all());
        $this->assertSame(1, $playlist->articles()->count());
        $this->assertSame('Intro din RundownContent.', $playlist->articles()->first()->intro);
        $this->assertSame('red', $playlist->articles()->first()->enps_marker_color);
        $this->assertSame(['INTRO', 'BETA'], $playlist->articles()->first()->article_types);
        $this->assertSame('Versiunea inițială', $items[0]->mos_objects[0]['editableObjects'][0]['value']);
        $this->assertArrayNotHasKey('basic_content', $items[0]->toArray());
        $this->assertArrayNotHasKey('tokens', $items[0]->basic_content);
        $this->assertNotContains('Password', array_column($items[0]->basic_content['ObjectProperties'], 'FieldName'));
        $snapshot = Storage::disk('local')->get($playlist->source_enps_snapshot_path);
        $this->assertStringContainsString('TextCommands', $snapshot);
        $this->assertStringNotContainsString('private-secret', $snapshot);
        $this->assertCount(2, Http::recorded(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?')));
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?') && str_contains($request->url(), 'guid=intro'));
        Http::assertSent(function (Request $request) {
            if (! str_contains($request->url(), '/api/BasicContent?')) {
                return false;
            }
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);

            return $request->method() === 'GET' && $query === ['database' => 'ITEM_DB', 'path' => 'P_NEWS\\W\\R_playlist', 'guid' => 'beta', 'hitHighlightTerm' => '']
                && $request->hasHeader('X-ENPS-TOKEN', 'rundown-token');
        });
        Http::assertSent(fn (Request $request) => str_contains($request->url(), 'guid=excluded') && $request->hasHeader('X-ENPS-TOKEN', 'basic-beta'));
        $this->assertSame('basic-excluded', json_decode(Crypt::decryptString(session('enps_web.tokens')), true)['nom']);
        $this->get(route('playlists.show', $playlist))->assertInertia(fn ($page) => $page
            ->has('articles', 1)
            ->where('articles.0.mos_objects.0.slug', '01_Titlu')
            ->where('articles.0.mos_objects.0.editableObjects.0.value', 'Versiunea inițială')
            ->where('articles.0.mos_objects.0.editableObjects.0.role', 'title')
            ->missing('articles.0.mos_objects.0.objectId')
            ->missing('articles.0.basic_content'));
    }

    public function test_refresh_replaces_all_basic_content_removes_missing_items_and_preserves_images(): void
    {
        Http::fake(fn (Request $request) => $this->respond($request));
        $playlist = $this->import();
        $oldSnapshot = $playlist->source_enps_snapshot_path;
        $article = $playlist->articles()->first();
        $image = Image::create(['url' => 'library/preserved.jpg']);
        $article->update(['image_id' => $image->id]);
        $this->mosValue = 'Valoare MOS actualizată';
        $this->scripts = [$this->script(1, 'intro', 'MD MATERIAL-INTRO'), $this->script(2, 'off', 'MD MATERIAL-OFF')];
        $this->post(route('playlists.refresh-parsing', $playlist))->assertSessionHasNoErrors();
        $items = $playlist->enpsItems()->get();
        $this->assertSame(['off'], $items->pluck('source_guid')->all());
        foreach ($items as $item) {
            $this->assertSame('Valoare MOS actualizată', $item->mos_objects[0]['editableObjects'][0]['value']);
        }
        $this->assertSame($image->id, $article->fresh()->image_id);
        Storage::disk('local')->assertMissing($oldSnapshot);
        $this->assertStringContainsString('Valoare MOS actualizată', Storage::disk('local')->get($playlist->fresh()->source_enps_snapshot_path));
        $this->assertCount(3, Http::recorded(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?')));
        $this->assertSame('Valoare MOS actualizată', $article->fresh()->mos_objects[0]['editableObjects'][0]['value']);
        $this->delete(route('playlists.destroy', $playlist))->assertRedirect('/playlists');
        $this->assertDatabaseCount('playlist_enps_items', 0);
        $this->assertDatabaseHas('images', ['id' => $image->id]);
    }

    public function test_partial_basic_content_failure_never_creates_a_partial_playlist(): void
    {
        Http::fake(function (Request $request) {
            if (str_contains($request->url(), '/api/BasicContent?') && str_contains($request->url(), 'guid=excluded')) {
                throw new ConnectionException('timed out private-secret');
            }

            return $this->respond($request);
        });
        $this->postJson('/playlists/enps/import', $this->selection())->assertServiceUnavailable()->assertJsonPath('error.kind', 'timeout')->assertDontSee('private-secret');
        $this->assertDatabaseCount('playlists', 0);
        $this->assertDatabaseCount('playlist_enps_items', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('playlist-enps-sources'));
    }

    public function test_repeated_record_references_are_fetched_once_but_each_occurrence_is_saved(): void
    {
        $this->scripts[] = $this->script(4, 'beta', 'MD MATERIAL-BETA');
        Http::fake(fn (Request $request) => $this->respond($request));
        $playlist = $this->import();
        $this->assertSame(['beta', 'excluded', 'beta'], $playlist->enpsItems()->pluck('source_guid')->all());
        $this->assertCount(2, Http::recorded(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?')));
    }

    public function test_a_named_record_without_guid_does_not_silently_lose_basic_content(): void
    {
        unset($this->scripts[0]['RecordPointer']['ListData']['Guid']);
        Http::fake(fn (Request $request) => $this->respond($request));
        $this->postJson('/playlists/enps/import', $this->selection())->assertUnprocessable()->assertJsonPath('error.kind', 'invalid_response');
        $this->assertDatabaseCount('playlists', 0);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '/api/BasicContent?'));
    }

    public function test_invalid_basic_content_on_refresh_preserves_all_previous_data(): void
    {
        $fail = false;
        Http::fake(function (Request $request) use (&$fail) {
            if ($fail && str_contains($request->url(), 'guid=beta')) {
                return Http::response(['ListData' => ['Guid' => 'wrong-guid'], 'ObjectProperties' => []]);
            }

            return $this->respond($request);
        });
        $playlist = $this->import();
        $oldItems = $playlist->enpsItems()->get()->toJson();
        $oldContent = $playlist->enpsItems()->first()->basic_content;
        $oldSnapshot = Storage::disk('local')->get($playlist->source_enps_snapshot_path);
        $this->mosValue = 'Nu trebuie salvat';
        $fail = true;
        $this->post(route('playlists.refresh-parsing', $playlist))->assertSessionHasErrors('playlist');
        $this->assertSame($oldItems, $playlist->enpsItems()->get()->toJson());
        $this->assertSame($oldContent, $playlist->enpsItems()->first()->basic_content);
        $this->assertSame($oldSnapshot, Storage::disk('local')->get($playlist->fresh()->source_enps_snapshot_path));
        $this->assertSame('Intro din RundownContent.', $playlist->articles()->first()->intro);
        $this->assertSame([$playlist->source_enps_snapshot_path], Storage::disk('local')->allFiles('playlist-enps-sources'));
    }

    public function test_refresh_reauthenticates_when_session_expires_during_basic_content(): void
    {
        config(['services.enps.url' => 'http://enps.test/web/', 'services.enps.username' => 'test', 'services.enps.password' => 'private-secret', 'services.enps.domain' => '']);
        $expire = false;
        $expired = false;
        Http::fake(function (Request $request) use (&$expire, &$expired) {
            if ($expire && ! $expired && str_contains($request->url(), '/api/BasicContent?')) {
                $expired = true;

                return Http::response([], 401);
            }

            return $this->respond($request);
        });
        $playlist = $this->import();
        $expire = true;
        $this->mosValue = 'După reconectare';
        $this->post(route('playlists.refresh-parsing', $playlist))->assertSessionHasNoErrors();
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Logon'));
        $this->assertSame('După reconectare', $playlist->enpsItems()->first()->mos_objects[0]['editableObjects'][0]['value']);
        $this->assertSame(2, $playlist->enpsItems()->count());
    }

    public function test_database_failure_restores_deleted_item_records_and_old_snapshot(): void
    {
        Http::fake(fn (Request $request) => $this->respond($request));
        $playlist = $this->import();
        $oldItems = $playlist->enpsItems()->get()->map(fn ($item) => $item->getAttributes())->all();
        $oldSnapshot = $playlist->source_enps_snapshot_path;
        $article = $playlist->articles()->first();
        $article->update(['intro' => 'Editare locală']);
        $this->mosValue = 'Nu trebuie salvat';
        Log::spy();
        $events = PlaylistEnpsItem::getEventDispatcher();
        PlaylistEnpsItem::setEventDispatcher(clone $events);
        PlaylistEnpsItem::creating(fn () => throw new \RuntimeException('private-secret'));
        try {
            $this->post(route('playlists.refresh-parsing', $playlist))->assertSessionHasErrors('playlist')->assertDontSee('private-secret');
        } finally {
            PlaylistEnpsItem::setEventDispatcher($events);
        }
        $this->assertSame($oldItems, $playlist->enpsItems()->get()->map(fn ($item) => $item->getAttributes())->all());
        $this->assertSame('Editare locală', $article->fresh()->intro);
        $this->assertSame($oldSnapshot, $playlist->fresh()->source_enps_snapshot_path);
        $this->assertSame([$oldSnapshot], Storage::disk('local')->allFiles('playlist-enps-sources'));
        Log::shouldHaveReceived('warning')->once()->with('Refresh ENPS eșuat.', [
            'playlist_id' => $playlist->id, 'stage' => 'persistence', 'exception_type' => \RuntimeException::class,
        ]);
    }

    public function test_malformed_mos_is_retained_as_source_without_resolving_external_entities(): void
    {
        $content = ['ObjectProperties' => [['FieldName' => 'TextCommands', 'FieldValue' => [
            'bad' => '[<mos><editableObject>broken</mos>]',
            'entity' => '[<mos><!DOCTYPE mos SYSTEM="file:///private"><itemSlug>bad</itemSlug></mos>]',
            'valid' => '[<mos><itemSlug>01_Titlu</itemSlug><mosExternalMetadata><mosPayload><editableObject type="TEXT"><name>Titlu</name><value>A &amp; B</value></editableObject></mosPayload></mosExternalMetadata></mos>]',
        ]]]];
        $objects = EnpsBasicContent::mosObjects($content);
        $this->assertCount(1, $objects);
        $this->assertSame('A & B', $objects[0]['editableObjects'][0]['value']);
        $this->assertSame($content, EnpsBasicContent::forStorage($content));
    }

    private function import(): Playlist
    {
        $response = $this->postJson('/playlists/enps/import', $this->selection())->assertCreated()->assertDontSee('private-secret')->assertDontSee('TextCommands');

        return Playlist::findOrFail($response->json('playlist.id'));
    }

    private function selection(): array
    {
        return ['path' => 'P_NEWS\\W\\R_playlist', 'guid' => 'playlist-guid'];
    }

    private function script(int $order, string $guid, string $title): array
    {
        return ['ScriptOrder' => $order, 'RecordPointer' => ['ListData' => [
            'ENPSDatabase' => 'ITEM_DB', 'Path' => 'P_NEWS\\W\\R_playlist', 'Guid' => $guid,
            'Title' => $title, 'BeginText' => 'INTRO: Intro din RundownContent.', 'Approved' => false,
        ]]];
    }

    private function respond(Request $request)
    {
        if ($request->url() === 'http://enps.test/web/') {
            return Http::response('<script>var serverConfig={"serviceAddress":"http://enps.test/json"};</script>');
        }
        if (str_ends_with($request->url(), '/api/Logon')) {
            return Http::response(['UserID' => 'TEST', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'login-token']);
        }
        if (str_ends_with($request->url(), '/api/Lists')) {
            return Http::response(['Records' => []]);
        }
        if (str_contains($request->url(), '/api/RundownContent?')) {
            return Http::response(['CollectionScripts' => $this->scripts], 200, ['X-ENPS-TOKEN' => 'rundown-token']);
        }
        if (str_contains($request->url(), '/api/BasicContent?')) {
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);
            $command = '[<mos><itemID>2</itemID><objID>mos-object</objID><itemSlug>01_Titlu</itemSlug><mosID>TVRMCG</mosID><mosExternalMetadata><mosPayload><editableObject type="TEXT"><name>Titlu</name><value>'.$this->mosValue.'</value></editableObject></mosPayload></mosExternalMetadata></mos>]';

            return Http::response([
                'tokens' => 'private-secret',
                'ListData' => ['Guid' => $query['guid'], 'Title' => 'Basic title', 'BeginText' => 'Text BasicContent diferit.', 'Approved' => true],
                'ObjectProperties' => [
                    ['FieldName' => 'TextCommands', 'FieldValue' => ['command-'.$query['guid'] => $command]],
                    ['FieldName' => 'Text', 'FieldValue' => '<span id="command-'.$query['guid'].'"></span>'],
                    ['FieldName' => 'Password', 'FieldValue' => 'private-secret'],
                ],
            ], 200, ['X-ENPS-TOKEN' => 'basic-'.$query['guid'], 'Authorization' => 'Bearer basic-'.$query['guid']]);
        }

        return Http::response(['status' => true]);
    }
}
