<?php

namespace Tests\Feature;

use App\Models\ApplicationSetting;
use App\Models\Article;
use App\Models\Playlist;
use App\Models\User;
use App\Services\Playlists\PlaylistTitleExclusions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlaylistTitleExclusionsSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_settings_page_exposes_the_default_exclusions(): void
    {
        $this->get(route('profile.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('playlistTitleExclusions', PlaylistTitleExclusions::DEFAULT_TERMS));
    }

    public function test_article_slugs_column_can_store_all_parsed_segments(): void
    {
        $this->assertSame('text', Schema::getColumnType('articles', 'slugs'));

        $playlist = Playlist::create(['title' => 'Playlist cu multe segmente']);
        $slugs = implode('||', array_fill(0, 20, str_repeat('SEGMENT', 10)));

        $article = Article::create([
            'title' => 'Titlu',
            'subtitle' => 'SUBTITLU',
            'slugs' => $slugs,
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
        ]);

        $this->assertGreaterThan(255, strlen($slugs));
        $this->assertSame($slugs, $article->fresh()->slugs);
    }

    public function test_guest_cannot_update_the_exclusions(): void
    {
        auth()->logout();

        $this->patch(route('profile.playlist-title-exclusions.update'), ['terms' => []])
            ->assertRedirect(route('login'));

        $this->assertDatabaseMissing('application_settings', [
            'key' => PlaylistTitleExclusions::SETTING_KEY,
        ]);
    }

    public function test_user_can_save_a_normalized_list_without_changing_existing_playlists(): void
    {
        $playlist = Playlist::create(['title' => 'Playlist existent']);
        $article = Article::create([
            'title' => 'Titlu existent',
            'subtitle' => 'LIVE EXISTENT',
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
        ]);

        $this->patch(route('profile.playlist-title-exclusions.update'), [
            'terms' => [' live ', 'LIVE', '', ' meteo '],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame(
            ['LIVE', 'METEO'],
            json_decode(ApplicationSetting::query()
                ->where('key', PlaylistTitleExclusions::SETTING_KEY)
                ->value('value'), true),
        );
        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
            'subtitle' => 'LIVE EXISTENT',
        ]);
    }

    public function test_invalid_lists_are_rejected(): void
    {
        $this->from(route('profile.edit'))
            ->patch(route('profile.playlist-title-exclusions.update'), ['terms' => 'LIVE'])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHasErrors('terms');

        $this->from(route('profile.edit'))
            ->patch(route('profile.playlist-title-exclusions.update'), ['terms' => [str_repeat('A', 101)]])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHasErrors('terms.0');

        $this->assertDatabaseMissing('application_settings', [
            'key' => PlaylistTitleExclusions::SETTING_KEY,
        ]);
    }

    public function test_default_list_keeps_supported_typed_articles(): void
    {
        $playlist = $this->importFixture();

        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'LIVE DECLARATII BUCURESTI',
        ]);
        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'HEADLINES',
        ]);
        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'TEASE INCENDII EUROPA',
        ]);
    }

    public function test_adding_live_to_exclusions_removes_live_articles_from_new_playlists(): void
    {
        app(PlaylistTitleExclusions::class)->save(
            [...PlaylistTitleExclusions::DEFAULT_TERMS, 'LIVE'],
        );

        $playlist = $this->importFixture();

        $this->assertDatabaseMissing('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'LIVE DECLARATII BUCURESTI',
        ]);
    }

    public function test_custom_terms_are_case_insensitive_literal_fragments(): void
    {
        app(PlaylistTitleExclusions::class)->save(['inchidere cernavoda', 'CENTRALA.*']);

        $playlist = $this->importFixture();

        $this->assertDatabaseMissing('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'INCHIDERE CERNAVODA',
        ]);
        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'CENTRALA UNGARIA MATINAL',
        ]);
    }

    public function test_empty_list_disables_title_exclusions_for_new_playlists(): void
    {
        app(PlaylistTitleExclusions::class)->save([]);

        $playlist = $this->importFixture();

        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'LIVE DECLARATII BUCURESTI',
        ]);
    }

    private function importFixture(): Playlist
    {
        $path = base_path('tests/titles/x3007TELEJURNAL_1300.HTM');

        $this->post(route('playlists.store'), [
            'file' => new UploadedFile($path, 'x3007TELEJURNAL_1300.HTM', 'text/html', null, true),
        ])->assertRedirect()->assertSessionHasNoErrors();

        return Playlist::query()->latest('id')->firstOrFail();
    }
}
