<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_removed_playlist_form_routes_are_not_available(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/playlists/create')->assertNotFound();
        $this->get('/playlists/1/edit')->assertNotFound();
    }

    public function test_dashboard_redirects_to_playlists(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/dashboard')
            ->assertRedirect(route('playlists.index'));
    }
}
