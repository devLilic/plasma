<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LlcTestPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_llc_test_page_requires_authentication(): void
    {
        $this->get('/llc-test')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_open_llc_test_page(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/llc-test')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('LLC/TestPage')
                ->where('auth.user.name', auth()->user()->name));
    }
}
