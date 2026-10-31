<?php

namespace Tests\Feature;

use App\Models\Playlist;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DailyPlaylistsNavigationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_authenticated_navigation_includes_playlists_created_within_the_local_day_boundaries(): void
    {
        config(['app.timezone' => 'Europe/Chisinau']);
        Carbon::setTestNow(Carbon::parse('2026-10-31 12:00:00', 'Europe/Chisinau'));

        $this->playlistCreatedAt('2026-10-30 23:59:59');
        $atStart = $this->playlistCreatedAt('2026-10-31 00:00:00');
        $duringDay = $this->playlistCreatedAt('2026-10-31 09:30:00');
        $atEnd = $this->playlistCreatedAt('2026-10-31 23:59:59');
        $this->playlistCreatedAt('2026-11-01 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('playlists.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('dailyPlaylists', fn ($playlists) => collect($playlists)->pluck('id')->all() === [
                    $atEnd->id,
                    $duringDay->id,
                    $atStart->id,
                ]));

    }

    public function test_guest_page_props_do_not_expose_daily_playlists(): void
    {
        config(['app.timezone' => 'Europe/Chisinau']);
        Carbon::setTestNow(Carbon::parse('2026-10-31 12:00:00', 'Europe/Chisinau'));
        $this->playlistCreatedAt('2026-10-31 10:00:00');

        $this->get(route('login'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('dailyPlaylists', []));
    }

    private function playlistCreatedAt(string $localDateTime): Playlist
    {
        $playlist = Playlist::create(['title' => $localDateTime]);
        $playlist->forceFill([
            'created_at' => Carbon::parse($localDateTime, 'Europe/Chisinau'),
            'updated_at' => Carbon::parse($localDateTime, 'Europe/Chisinau'),
        ])->save();

        return $playlist;
    }
}
