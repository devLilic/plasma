<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_v1_endpoints_reject_anonymous_requests(): void
    {
        $this->getJson('/api/v1/images')->assertUnauthorized();
        $this->getJson('/api/v1/images/search?query=test')->assertUnauthorized();
        $this->getJson('/api/v1/tags?query=test')->assertUnauthorized();
        $this->postJson('/api/v1/crop')->assertUnauthorized();
        $this->postJson('/api/v1/files')->assertUnauthorized();
        $this->patchJson('/api/v1/images/1')->assertUnauthorized();
        $this->deleteJson('/api/v1/images/1')->assertUnauthorized();
    }

    public function test_authenticated_user_can_access_v1_api(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/images')
            ->assertOk()
            ->assertExactJson([]);
    }
}
