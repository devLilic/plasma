<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Enps\EnpsWebClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EnpsWebIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.enps.url' => 'http://95.65.10.186:8808/enpswebaccess3/',
            'services.enps.username' => 'Test.User',
            'services.enps.password' => 'enps-test-password',
            'services.enps.domain' => '',
            'services.enps.timezone' => 'Europe/Chisinau',
            'services.enps.timeout' => 20,
        ]);
    }

    public function test_enps_test_routes_require_a_plasma_login(): void
    {
        $this->get('/enps-test')->assertRedirect('/login');
        $this->post('/enps-test/connect')->assertRedirect('/login');
        $this->post('/enps-test/playlist-content')->assertRedirect('/login');
        $this->post('/enps-test/refresh-playlists')->assertRedirect('/login');
        Http::assertNothingSent();
    }

    public function test_authenticated_user_can_see_the_enps_test_page_without_secrets(): void
    {
        config(['services.enps.username' => null, 'services.enps.password' => null]);

        $this->actingAs(User::factory()->create())
            ->get('/enps-test')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ENPS/TestPage')
                ->where('configuration.configured', false)
                ->where('configuration.domain', '')
                ->missing('configuration.username')
                ->missing('configuration.password')
                ->where('connection', null));
    }

    public function test_missing_credentials_are_reported_without_contacting_enps(): void
    {
        config(['services.enps.username' => null, 'services.enps.password' => null]);
        Http::fake();

        $this->actingAs(User::factory()->create())
            ->postJson('/enps-test/connect')
            ->assertUnprocessable()
            ->assertJsonPath('error.kind', 'configuration')
            ->assertJsonMissing(['enps-test-password']);

        Http::assertNothingSent();
    }

    public function test_rejected_enps_credentials_produce_a_safe_authentication_error(): void
    {
        Http::fake(function (Request $request) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') {
                return Http::response($this->landingPage());
            }
            if (str_ends_with($request->url(), '/api/IsAlive')) {
                return Http::response(['status' => true]);
            }

            return Http::response(['error' => 'do not expose this body'], 403);
        });

        $response = $this->actingAs(User::factory()->create())->postJson('/enps-test/connect');
        $response->assertUnprocessable()
            ->assertJsonPath('error.kind', 'credentials')
            ->assertJsonPath('error.message', 'Autentificarea ENPS a fost refuzată. Verifică utilizatorul, parola și domeniul.')
            ->assertJsonPath('connection', null)
            ->assertDontSee('do not expose this body')
            ->assertDontSee('enps-test-password');
    }

    public function test_login_ping_global_tables_and_later_ping_keep_secrets_out_of_responses(): void
    {
        Http::fake(function (Request $request) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') {
                return Http::response($this->landingPage(), 200, ['Set-Cookie' => 'ASP.NET_SessionId=web-session; path=/; HttpOnly']);
            }

            if (str_ends_with($request->url(), '/api/IsAlive')) {
                return Http::response(['status' => true]);
            }

            if (str_ends_with($request->url(), '/api/Logon')) {
                return Http::response(['UserID' => 'TEST-USER', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, [
                    'X-ENPS-TOKEN' => 'nom-login-secret',
                    'Authorization' => 'Bearer jwt-login-secret',
                    'Set-Cookie' => 'ENPSSession=api-session; path=/; HttpOnly',
                ]);
            }

            if (str_ends_with($request->url(), '/api/Ping')) {
                return Http::response(['status' => true], 200, [
                    'X-ENPS-TOKEN' => 'nom-ping-secret',
                    'Authorization' => 'Bearer jwt-ping-secret',
                ]);
            }

            if (str_contains($request->url(), '/api/GlobalTables?')) {
                return Http::response(['languageSettings' => [['Language' => 'English']], 'storyTypes' => ['A', 'B']], 200, [
                    'X-ENPS-TOKEN' => 'nom-global-secret',
                    'Authorization' => 'Bearer jwt-global-secret',
                ]);
            }

            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [
                    ['ListData' => ['Title' => 'Jurnalul de seară', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'playlist-guid', 'StartTime' => '2026-10-04T16:00:00Z']],
                    ['ListData' => ['Title' => 'Conserve [31.10.2026, 14:00]', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'second-playlist-guid']],
                    ['ListData' => ['Title' => 'Fact or Fake', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'third-playlist-guid', 'WorkDate' => '2026-10-10', 'StartTime' => '09:50']],
                    ['ListData' => ['Title' => 'domenii reporteri', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'fourth-playlist-guid', 'ModTime' => '2027-11-03T12:00:00Z']],
                    ['ListData' => ['Title' => 'Un material', 'Type' => 3, 'Path' => 'P_NEWS\\W', 'Guid' => 'script-guid']],
                ], 'UserCanWriteScripts' => ['P_NEWS\\W' => true]], 206, [
                    'X-ENPS-TOKEN' => 'nom-lists-secret',
                    'Authorization' => 'Bearer jwt-lists-secret',
                ]);
            }

            if (str_ends_with($request->url(), '/api/Logout')) {
                return Http::response(['status' => false], 503);
            }

            return Http::response([], 404);
        });

        $user = User::factory()->create();
        $login = $this->actingAs($user)->postJson('/enps-test/connect');
        $login->assertOk()
            ->assertJsonPath('connection.user', 'TEST-USER')
            ->assertJsonPath('connection.homeDatabase', 'NEWS')
            ->assertJsonPath('connection.homeProgram', 'NEWS')
            ->assertJsonPath('connection.globalTables.languageSettings', 1)
            ->assertJsonPath('connection.globalTables.storyTypes', 2)
            ->assertJsonPath('connection.playlists.0.title', 'Jurnalul de seară')
            ->assertJsonPath('connection.playlists.0.workAt', '04.10.2026, 19:00')
            ->assertJsonPath('connection.playlists.1.title', 'Conserve')
            ->assertJsonPath('connection.playlists.1.workAt', '31.10.2026, 14:00')
            ->assertJsonPath('connection.playlists.2.workAt', '10.10.2026, 09:50')
            ->assertJsonPath('connection.playlists.3.title', 'domenii reporteri')
            ->assertJsonPath('connection.playlists.3.workAt', '03.11.2027, 15:00')
            ->assertJsonCount(4, 'connection.playlists')
            ->assertJsonMissingPath('connection.tokens')
            ->assertJsonMissingPath('connection.cookies');
        foreach (['nom-login-secret', 'jwt-login-secret', 'nom-ping-secret', 'jwt-ping-secret', 'nom-global-secret', 'jwt-global-secret', 'nom-lists-secret', 'jwt-lists-secret', 'enps-test-password'] as $secret) {
            $login->assertDontSee($secret);
        }

        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Logon')
            && $request->method() === 'POST'
            && $request->data()['staffUserId'] === 'TEST-USER'
            && $request->data()['domainUserId'] === 'TEST-USER'
            && $request->data()['domainName'] === ''
            && $request->data()['iClientType'] === 9
            && $request->hasHeader('X-ENPS-TOKEN') === false);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/GlobalTables?filterLangPrefix=MobileV3&filterInActiveUsers=True')
            && $request->hasHeader('X-ENPS-TOKEN', 'nom-ping-secret')
            && $request->hasHeader('Authorization', 'Bearer jwt-ping-secret'));
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Lists')
            && $request->method() === 'POST'
            && $request->data()['Database'] === 'NEWS'
            && $request->data()['ENPSListParameters'] === [[
                'Path' => 'P_NEWS\\W',
                'Guid' => '',
                'Type' => 0,
                'StartTime' => '1800-02-28T22:04:40.000Z',
                'EndTime' => '1800-02-28T22:04:40.000Z',
                'Priority' => -1,
                'UnreadBy' => '',
            ]]
            && $request->hasHeader('X-ENPS-TOKEN', 'nom-global-secret')
            && $request->hasHeader('Authorization', 'Bearer jwt-global-secret'));
        $this->assertCount(1, Http::recorded(fn (Request $request) => str_ends_with($request->url(), '/api/Lists')));

        $encryptedTokens = session()->get('enps_web.tokens');
        $this->assertIsString($encryptedTokens);
        $this->assertStringNotContainsString('nom-global-secret', $encryptedTokens);
        $this->assertSame([
            'nom' => 'nom-lists-secret',
            'authorization' => 'Bearer jwt-lists-secret',
        ], json_decode(Crypt::decryptString($encryptedTokens), true));

        $this->postJson('/enps-test/ping')->assertOk()->assertJsonPath('connection.user', 'TEST-USER')->assertJsonMissingPath('connection.tokens');
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Ping')
            && $request->hasHeader('X-ENPS-TOKEN', 'nom-lists-secret')
            && $request->hasHeader('Authorization', 'Bearer jwt-lists-secret'));

        $this->postJson('/enps-test/disconnect')->assertOk()->assertJsonPath('connection', null);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/Logout'));
        $this->assertNull(session()->get('enps_web.tokens'));
    }

    public function test_expired_sessions_are_cleared_and_require_a_new_login(): void
    {
        $pingCalls = 0;
        Http::fake(function (Request $request) use (&$pingCalls) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') {
                return Http::response($this->landingPage());
            }
            if (str_ends_with($request->url(), '/api/IsAlive')) {
                return Http::response(['status' => true]);
            }
            if (str_ends_with($request->url(), '/api/Logon')) {
                return Http::response(['UserID' => 'TEST-USER', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'nom-secret']);
            }
            if (str_ends_with($request->url(), '/api/Ping')) {
                $pingCalls++;
                return $pingCalls > 1 ? Http::response(['error' => 'expired'], 401) : Http::response(['status' => true]);
            }
            if (str_contains($request->url(), '/api/GlobalTables?')) {
                return Http::response(['languageSettings' => [], 'storyTypes' => []]);
            }
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => []], 200);
            }
            return Http::response(['ok' => true]);
        });

        $this->actingAs(User::factory()->create())->postJson('/enps-test/connect')->assertOk();
        $this->postJson('/enps-test/ping')
            ->assertUnauthorized()
            ->assertJsonPath('error.kind', 'expired')
            ->assertJsonPath('connection', null);
        $this->assertNull(session()->get('enps_web.tokens'));
    }

    public function test_clicking_a_playlist_loads_its_content_and_updates_session_tokens(): void
    {
        Http::fake(function (Request $request) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') {
                return Http::response($this->landingPage());
            }
            if (str_ends_with($request->url(), '/api/IsAlive')) return Http::response(['status' => true]);
            if (str_ends_with($request->url(), '/api/Logon')) {
                return Http::response(['UserID' => 'TEST-USER', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'token-logon']);
            }
            if (str_ends_with($request->url(), '/api/Ping')) return Http::response(['status' => true], 200, ['X-ENPS-TOKEN' => 'token-ping']);
            if (str_contains($request->url(), '/api/GlobalTables?')) return Http::response(['tables' => []], 200, ['X-ENPS-TOKEN' => 'token-global']);
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [
                    ['ListData' => ['Title' => 'Jurnalul de seară', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'playlist-guid']],
                ]], 206, ['X-ENPS-TOKEN' => 'token-lists']);
            }
            if (str_contains($request->url(), '/api/RundownContent?')) {
                return Http::response(['Records' => [
                    ['ListData' => ['Title' => 'MD INCENDIU-OFF', 'Type' => 3]],
                    ['ListData' => ['Title' => 'MD MATERIAL', 'Type' => 3], 'ObjectProperties' => [['FieldName' => 'StoryType', 'FieldValue' => 'BETA']]],
                    ['ListData' => ['Title' => 'RO DECLARATII-LIVE-INTRO', 'Type' => 3]],
                ]], 200, ['X-ENPS-TOKEN' => 'token-content']);
            }

            return Http::response([], 404);
        });

        $this->actingAs(User::factory()->create())->postJson('/enps-test/connect')->assertOk();
        $response = $this->postJson('/enps-test/playlist-content', ['guid' => 'playlist-guid', 'path' => 'P_NEWS\\W']);
        $response
            ->assertOk()
            ->assertJsonPath('stories.0.name', 'MD INCENDIU')
            ->assertJsonPath('stories.0.status', 'OFF')
            ->assertJsonPath('stories.1.name', 'MD MATERIAL')
            ->assertJsonPath('stories.1.status', 'BETA')
            ->assertJsonPath('stories.2.name', 'RO DECLARATII')
            ->assertJsonPath('stories.2.status', 'LIVE')
            ->assertJsonCount(3, 'stories');

        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent?')
            && str_contains($request->url(), 'database=NEWS')
            && str_contains($request->url(), 'guid=playlist-guid')
            && str_contains($request->url(), 'returnText=true')
            && $request->method() === 'GET'
            && $request->hasHeader('X-ENPS-TOKEN', 'token-lists'));
        $this->assertSame('token-content', json_decode(Crypt::decryptString(session()->get('enps_web.tokens')), true)['nom']);
    }

    public function test_collection_script_recordpointer_titles_are_grouped_with_segment_badges(): void
    {
        Http::fake(function (Request $request) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') return Http::response($this->landingPage());
            if (str_ends_with($request->url(), '/api/IsAlive')) return Http::response(['status' => true]);
            if (str_ends_with($request->url(), '/api/Logon')) return Http::response(['UserID' => 'TEST-USER', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'token-logon']);
            if (str_ends_with($request->url(), '/api/Ping')) return Http::response(['status' => true]);
            if (str_contains($request->url(), '/api/GlobalTables?')) return Http::response(['tables' => []]);
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [
                    ['ListData' => ['Title' => 'TELEJURNAL 1300', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'playlist-guid']],
                ]]);
            }
            if (str_contains($request->url(), '/api/RundownContent?')) {
                return Http::response(['CollectionScripts' => [
                    ['ScriptOrder' => 7, 'PageNum' => '17', 'RecordPointer' => ['ListData' => ['Title' => 'RO DINEU SPANIA OFF-OFF']]],
                    ['ScriptOrder' => 5, 'PageNum' => '15', 'RecordPointer' => ['ListData' => ['Title' => 'MD AMALGAMARE RAIOANE SNC OFF-OFF']]],
                    ['ScriptOrder' => 2, 'PageNum' => '3', 'RecordPointer' => ['ListData' => ['Title' => 'HEADLINES-BETA']]],
                    ['ScriptOrder' => 6, 'PageNum' => '16', 'RecordPointer' => ['ListData' => ['Title' => 'RO DINEU SPANIA OFF-AMB']]],
                    ['ScriptOrder' => 3, 'PageNum' => '13', 'RecordPointer' => ['ListData' => ['Title' => 'MD AMALGAMARE RAIOANE SNC OFF-INTRO']]],
                    ['ScriptOrder' => 1, 'PageNum' => '2', 'RecordPointer' => ['ListData' => ['Title' => 'HEADLINES-INTRO']]],
                    ['ScriptOrder' => 4, 'PageNum' => '14', 'RecordPointer' => ['ListData' => ['Title' => 'MD AMALGAMARE RAIOANE SNC OFF-SNC']]],
                ]]);
            }

            return Http::response([], 404);
        });

        $this->actingAs(User::factory()->create())->postJson('/enps-test/connect')->assertOk();
        $this->postJson('/enps-test/playlist-content', ['guid' => 'playlist-guid', 'path' => 'P_NEWS\\W'])
            ->assertOk()
            ->assertJsonPath('stories.0.name', 'HEADLINES')
            ->assertJsonPath('stories.0.segments.0', 'INTRO')
            ->assertJsonPath('stories.0.segments.1', 'BETA')
            ->assertJsonPath('stories.1.name', 'MD AMALGAMARE RAIOANE SNC OFF')
            ->assertJsonPath('stories.1.segments.0', 'INTRO')
            ->assertJsonPath('stories.1.segments.1', 'SNC')
            ->assertJsonPath('stories.1.segments.2', 'OFF')
            ->assertJsonPath('stories.2.name', 'RO DINEU SPANIA OFF')
            ->assertJsonPath('stories.2.segments.0', 'AMB')
            ->assertJsonPath('stories.2.segments.1', 'OFF')
            ->assertJsonCount(3, 'stories');

        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '/api/BasicContent'));
    }

    public function test_playlist_content_requires_an_active_session_and_a_playlist_from_that_session(): void
    {
        Http::fake(function (Request $request) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') return Http::response($this->landingPage());
            if (str_ends_with($request->url(), '/api/IsAlive')) return Http::response(['status' => true]);
            if (str_ends_with($request->url(), '/api/Logon')) return Http::response(['UserID' => 'TEST-USER', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'test-token']);
            if (str_ends_with($request->url(), '/api/Ping')) return Http::response(['status' => true]);
            if (str_contains($request->url(), '/api/GlobalTables?')) return Http::response(['tables' => []]);
            if (str_ends_with($request->url(), '/api/Lists')) {
                return Http::response(['Records' => [
                    ['ListData' => ['Title' => 'Jurnalul de seară', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'playlist-guid']],
                ]]);
            }
            return Http::response([], 404);
        });
        $this->actingAs(User::factory()->create())
            ->postJson('/enps-test/connect')->assertOk();

        $this->postJson('/enps-test/playlist-content', ['guid' => 'foreign-guid', 'path' => 'P_NEWS\\W'])
            ->assertUnprocessable()
            ->assertJsonPath('error.kind', 'invalid_request');
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '/api/RundownContent'));

        $this->postJson('/enps-test/disconnect')->assertOk();
        Http::fake();
        $this->actingAs(User::factory()->create())
            ->postJson('/enps-test/playlist-content', ['guid' => 'foreign-guid', 'path' => 'P_NEWS\\W'])
            ->assertUnauthorized()
            ->assertJsonPath('error.kind', 'expired');
        Http::assertNothingSent();
    }

    public function test_existing_enps_session_can_refresh_playlist_schedule_data(): void
    {
        $listsCalls = 0;
        Http::fake(function (Request $request) use (&$listsCalls) {
            if ($request->url() === 'http://95.65.10.186:8808/enpswebaccess3/') return Http::response($this->landingPage());
            if (str_ends_with($request->url(), '/api/IsAlive')) return Http::response(['status' => true]);
            if (str_ends_with($request->url(), '/api/Logon')) return Http::response(['UserID' => 'TEST-USER', 'HomeDatabase' => 'NEWS', 'HomeProgram' => 'NEWS'], 200, ['X-ENPS-TOKEN' => 'login-token']);
            if (str_ends_with($request->url(), '/api/Ping')) return Http::response(['status' => true], 200, ['X-ENPS-TOKEN' => 'ping-token']);
            if (str_contains($request->url(), '/api/GlobalTables?')) return Http::response(['tables' => []], 200, ['X-ENPS-TOKEN' => 'tables-token']);
            if (str_ends_with($request->url(), '/api/Lists')) {
                $listsCalls++;
                $playlist = ['Title' => 'TELEJURNAL 1900', 'Type' => 2, 'Path' => 'P_NEWS\\W', 'Guid' => 'playlist-guid'];
                if ($listsCalls > 1) $playlist['StartTime'] = '2026-10-04T16:00:00Z';
                return Http::response(['Records' => [['ListData' => $playlist]]], 206, ['X-ENPS-TOKEN' => 'lists-'.$listsCalls]);
            }
            return Http::response([], 404);
        });

        $this->actingAs(User::factory()->create())->postJson('/enps-test/connect')->assertOk()
            ->assertJsonPath('connection.playlists.0.workAt', null);
        $this->postJson('/enps-test/refresh-playlists')->assertOk()
            ->assertJsonPath('connection.playlists.0.workAt', '04.10.2026, 19:00');
        $this->assertSame('lists-2', json_decode(Crypt::decryptString(session()->get('enps_web.tokens')), true)['nom']);
        $this->assertSame(2, $listsCalls);
    }

    public function test_device_key_matches_the_enps_triple_des_protocol_for_leap_and_regular_year_days(): void
    {
        $this->assertSame('Fy4EptEezf4qPOUAIMVWrMyDlIfMYjvFrAsY6TamTsh3hUVFjrmnIihDU+w/MF8k', EnpsWebClient::deviceKeyForDay(60));
        $this->assertSame('Fy4EptEezf4qPOUAIMVWrMyDlIfMYjvFrAsY6TamTsghAC2XqZ1Zh7CXkz+AA1t/', EnpsWebClient::deviceKeyForDay(365));
        $this->assertSame('Fy4EptEezf4qPOUAIMVWrMyDlIfMYjvFrAsY6TamTsghAC2XqZ1Zhyk02ykNXLZ6', EnpsWebClient::deviceKeyForDay(366));
    }

    private function landingPage(): string
    {
        return '<html><script>var serverConfig={"serviceAddress":"http://95.65.10.186:8808/NOMWebServices3JSON","defaultDomain":""};</script></html>';
    }
}
