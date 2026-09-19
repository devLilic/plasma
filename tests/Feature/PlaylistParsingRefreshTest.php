<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\Playlist;
use App\Models\User;
use App\Services\Playlists\PlaylistTitleExclusions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlaylistParsingRefreshTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->actingAs(User::factory()->create());
    }

    public function test_import_stores_the_htm_source_and_exposes_refresh_on_the_playlist_page(): void
    {
        $expectedContents = $this->document('MATERIAL');
        $playlist = $this->importPlaylist('jurnal.HTM', 'MATERIAL');

        $this->assertNotNull($playlist->source_htm_path);
        Storage::disk('local')->assertExists($playlist->source_htm_path);
        $this->assertSame($expectedContents, Storage::disk('local')->get($playlist->source_htm_path));

        $this->get(route('playlists.show', $playlist))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Playlist/PlaylistShowPage')
                ->where('playlist.id', $playlist->id)
                ->where('playlist.can_refresh_parsing', true));
    }

    public function test_import_persists_and_exposes_the_complete_structured_article(): void
    {
        $playlist = $this->importPlaylist('jurnal.HTM', 'MATERIAL');
        $article = $playlist->articles()->firstOrFail();

        $this->assertSame('MD MATERIAL', $article->technical_title);
        $this->assertSame(['BETA'], $article->article_types);
        $this->assertSame(['INTRO', 'BETA'], array_column($article->content_sections, 'type'));
        $this->assertSame(['Introducerea materialului.'], $article->content_sections[0]['paragraphs']);
        $this->assertSame(['MD MATERIAL', 'TITLU: TITLU EDITORIAL MATERIAL'], $article->content_sections[1]['paragraphs']);

        $this->get(route('playlists.show', $playlist))
            ->assertInertia(fn (Assert $page) => $page
                ->where('articles.0.technical_title', 'MD MATERIAL')
                ->where('articles.0.article_types', ['BETA'])
                ->where('articles.0.content_sections.1.type', 'BETA'));
    }

    public function test_legacy_articles_receive_resource_fallbacks_without_backfill(): void
    {
        $playlist = Playlist::create(['title' => 'Playlist vechi']);
        $playlist->articles()->create([
            'title' => 'Titlu vechi',
            'subtitle' => 'SLUG VECHI',
            'intro' => 'Intro vechi',
            'article_type' => 'OFF',
            'playlist_order' => 1,
        ]);

        $this->get(route('playlists.show', $playlist))
            ->assertInertia(fn (Assert $page) => $page
                ->where('articles.0.technical_title', 'SLUG VECHI')
                ->where('articles.0.article_types', ['OFF'])
                ->where('articles.0.content_sections.0.type', 'INTRO')
                ->where('articles.0.content_sections.0.paragraphs', ['Intro vechi']));

        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'technical_title' => null,
            'article_types' => null,
            'content_sections' => null,
        ]);
    }

    public function test_refresh_reparses_articles_while_preserving_existing_images(): void
    {
        $playlist = $this->importPlaylist('jurnal.HTM', 'MATERIAL');
        $image = Image::create(['url' => 'library/preserved.jpg']);
        $article = $playlist->articles()->where('subtitle', 'MATERIAL')->firstOrFail();
        $article->update([
            'title' => 'TITLU MODIFICAT',
            'intro' => 'INTRO MODIFICAT',
            'image_id' => $image->id,
        ]);
        $obsoleteArticle = $playlist->articles()->create([
            'title' => 'Material vechi',
            'subtitle' => 'MATERIAL VECHI',
            'article_type' => 'BETA',
            'playlist_order' => 2,
        ]);

        $this->post(route('playlists.refresh-parsing', $playlist))
            ->assertRedirect(route('playlists.show', $playlist));

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'title' => 'TITLU EDITORIAL MATERIAL',
            'subtitle' => 'MATERIAL',
            'intro' => 'Introducerea materialului.',
            'image_id' => $image->id,
            'playlist_order' => 1,
        ]);
        $this->assertDatabaseMissing('articles', ['id' => $obsoleteArticle->id]);
        $this->assertDatabaseHas('images', ['id' => $image->id]);
    }

    public function test_only_the_latest_ten_htm_sources_are_retained(): void
    {
        $firstPlaylist = $this->importPlaylist('jurnal-1.HTM', 'MATERIAL 1');
        $firstPath = $firstPlaylist->source_htm_path;

        foreach (range(2, 11) as $number) {
            $this->importPlaylist("jurnal-$number.HTM", "MATERIAL $number");
        }

        $this->assertNull($firstPlaylist->fresh()->source_htm_path);
        Storage::disk('local')->assertMissing($firstPath);
        $this->assertSame(10, Playlist::query()->whereNotNull('source_htm_path')->count());
        $this->assertCount(10, Storage::disk('local')->allFiles('playlist-sources'));
    }

    public function test_refresh_splits_legacy_tease_slugs_without_moving_the_main_article_image(): void
    {
        app(PlaylistTitleExclusions::class)->save([]);
        $playlist = $this->importContent('tease.HTM', $this->teaseDocument());
        $image = Image::create(['url' => 'library/main.jpg']);
        $tease = $playlist->articles()->where('subtitle', 'TEASE MATERIAL')->firstOrFail();
        $mainArticle = $playlist->articles()->where('subtitle', 'MATERIAL')->firstOrFail();
        $mainArticle->update([
            'slugs' => $tease->slugs.'||'.$mainArticle->slugs,
            'image_id' => $image->id,
        ]);
        $tease->delete();

        $this->post(route('playlists.refresh-parsing', $playlist))
            ->assertRedirect(route('playlists.show', $playlist));

        $this->assertDatabaseHas('articles', [
            'id' => $mainArticle->id,
            'subtitle' => 'MATERIAL',
            'image_id' => $image->id,
        ]);
        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'TEASE MATERIAL',
        ]);
    }

    public function test_refresh_is_rejected_for_playlists_created_without_a_stored_source(): void
    {
        $playlist = Playlist::create(['title' => 'Playlist vechi']);

        $this->post(route('playlists.refresh-parsing', $playlist))
            ->assertRedirect()
            ->assertSessionHasErrors('playlist');

        $this->get(route('playlists.show', $playlist))
            ->assertInertia(fn (Assert $page) => $page
                ->where('playlist.can_refresh_parsing', false));
    }

    private function importPlaylist(string $filename, string $technicalTitle): Playlist
    {
        return $this->importContent($filename, $this->document($technicalTitle));
    }

    private function importContent(string $filename, string $content): Playlist
    {
        $response = $this->post(route('playlists.store'), [
            'file' => UploadedFile::fake()->createWithContent(
                $filename,
                $content,
            ),
        ]);

        $playlist = Playlist::query()->latest('id')->firstOrFail();
        $response->assertRedirect(route('playlists.show', $playlist));

        return $playlist;
    }

    private function document(string $technicalTitle): string
    {
        return implode("\r\n", [
            '<HTML>',
            '<UL>',
            "<LI><A HREF=#MD $technicalTitle-INTRO>MD $technicalTitle-INTRO</A>",
            "<LI><A HREF=#MD $technicalTitle-BETA>MD $technicalTitle-BETA</A>",
            '</UL>',
            "<A NAME=MD $technicalTitle-INTRO>",
            '<P>Introducerea materialului.',
            '<FONT  SIZE=-2>',
            "<A NAME=MD $technicalTitle-BETA>",
            "<P>MD $technicalTitle",
            "<P>TITLU: TITLU EDITORIAL $technicalTitle",
            '<FONT  SIZE=-2>',
            '</HTML>',
        ]);
    }

    private function teaseDocument(): string
    {
        return implode("\r\n", [
            '<HTML>',
            '<UL>',
            '<LI><A HREF=#TEASE MATERIAL>TEASE MATERIAL</A>',
            '<LI><A HREF=#MD MATERIAL-INTRO>MD MATERIAL-INTRO</A>',
            '<LI><A HREF=#MD MATERIAL-BETA>MD MATERIAL-BETA</A>',
            '</UL>',
            '<A NAME=TEASE MATERIAL>',
            '<P>MD MATERIAL',
            '<P>TITLUL TEASE',
            '<FONT  SIZE=-2>',
            '<A NAME=MD MATERIAL-INTRO>',
            '<P>Introducerea materialului.',
            '<FONT  SIZE=-2>',
            '<A NAME=MD MATERIAL-BETA>',
            '<P>MD MATERIAL',
            '<P>TITLU: TITLU EDITORIAL MATERIAL',
            '<FONT  SIZE=-2>',
            '</HTML>',
        ]);
    }
}
