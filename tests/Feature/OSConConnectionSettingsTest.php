<?php

namespace Tests\Feature;

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Services\OSCon\OSConConnectionSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OSConConnectionSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_connection_secret_requires_auth_and_is_encrypted_and_never_in_profile_props(): void
    {
        $this->getJson(route('oscon.connection'))->assertUnauthorized();
        $token = str_repeat('private-oscon-token-', 3);
        $this->actingAs(User::factory()->create())->patch(route('profile.oscon.update'), [
            'endpoint' => 'http://127.0.0.1:47834', 'token' => $token,
        ])->assertSessionHasNoErrors();
        $stored = ApplicationSetting::where('key', OSConConnectionSettings::KEY)->value('value');
        $this->assertStringNotContainsString($token, $stored);
        $this->assertStringNotContainsString($token, $this->get(route('profile.edit'))->getContent());
        $this->getJson(route('oscon.connection'))->assertOk()->assertJsonPath('token', $token)
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_blank_token_preserves_secret_and_explicit_clear_removes_it(): void
    {
        $this->actingAs(User::factory()->create());
        $token = str_repeat('a', 64);
        $this->patch(route('profile.oscon.update'), ['endpoint' => 'http://127.0.0.1:47834', 'token' => $token])->assertSessionHasNoErrors();
        $this->patch(route('profile.oscon.update'), ['endpoint' => 'http://192.168.1.10:47834', 'token' => ''])->assertSessionHasNoErrors();
        $this->getJson(route('oscon.connection'))->assertJsonPath('token', $token)->assertJsonPath('endpoint', 'http://192.168.1.10:47834');
        $this->patch(route('profile.oscon.update'), ['endpoint' => 'http://192.168.1.10:47834', 'clearToken' => true])->assertSessionHasNoErrors();
        $this->getJson(route('oscon.connection'))->assertUnprocessable();
    }

    public function test_invalid_endpoint_and_corrupt_configuration_fail_closed_but_can_be_repaired(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (['file:///private', 'http://user:secret@127.0.0.1:47834', 'http://127.0.0.1:47834/path', 'http://127.0.0.1:47834?token=x'] as $endpoint) {
            $this->patch(route('profile.oscon.update'), ['endpoint' => $endpoint])->assertSessionHasErrors('endpoint');
        }
        ApplicationSetting::create(['key' => OSConConnectionSettings::KEY, 'value' => '{broken']);
        $this->getJson(route('oscon.connection'))->assertUnprocessable();
        $this->patch(route('profile.oscon.update'), ['endpoint' => 'http://127.0.0.1:47834', 'token' => str_repeat('b', 64)])->assertSessionHasNoErrors();
        $this->getJson(route('oscon.connection'))->assertOk();
    }
}
