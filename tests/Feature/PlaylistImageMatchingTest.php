<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Models\Tag;
use App\Models\User;
use App\Services\Images\ImageMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PlaylistImageMatchingTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_matches_library_images_even_without_previous_playlists(): void
    {
        $image = $this->imageWithTag('library/cernavoda.jpg', 'inchidere cernavoda');

        $playlist = $this->importFixture();

        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'INCHIDERE CERNAVODA',
            'image_id' => $image->id,
        ]);
    }

    public function test_article_without_an_image_does_not_block_tag_matching(): void
    {
        $previousPlaylist = Playlist::create(['title' => 'Anterior']);
        Article::create([
            'title' => 'Titlu anterior',
            'subtitle' => 'FAKE VIZITA TOFAN ROMANIA',
            'article_type' => 'BETA',
            'playlist_id' => $previousPlaylist->id,
            'playlist_order' => 1,
        ]);
        Tag::create(['title' => 'tofan romania']);
        $image = $this->imageWithTag('library/tofan.jpg', 'tofan');

        $playlist = $this->importFixture();

        $this->assertDatabaseHas('articles', [
            'playlist_id' => $playlist->id,
            'subtitle' => 'FAKE VIZITA TOFAN ROMANIA',
            'image_id' => $image->id,
        ]);
    }

    public function test_images_are_ranked_by_phrase_and_word_relevance(): void
    {
        $unrelated = $this->imageWithTag('library/unrelated.jpg', 'politica');
        $partial = $this->imageWithTag('library/tutun.jpg', 'tutun');
        $phrase = $this->imageWithTag('library/plantatii-tutun.jpg', 'plantatii tutun');

        $ranked = app(ImageMatcher::class)->rank(
            Image::with('tags')->get(),
            ['ULTIMII CULTIVATORI DE TUTUN', 'PLANTATII TUTUN']
        );

        $this->assertSame([$phrase->id, $partial->id, $unrelated->id], $ranked->pluck('id')->all());
    }

    private function importFixture(): Playlist
    {
        $this->actingAs(User::factory()->create());
        $path = base_path('tests/titles/x3007TELEJURNAL_1300.HTM');

        $this->post(route('playlists.store'), [
            'file' => new UploadedFile($path, 'x3007TELEJURNAL_1300.HTM', 'text/html', null, true),
        ])->assertRedirect();

        return Playlist::orderByDesc('id')->firstOrFail();
    }

    private function imageWithTag(string $url, string $tagTitle): Image
    {
        $image = Image::create(['url' => $url]);
        $tag = Tag::firstOrCreate(['title' => $tagTitle]);
        $image->tags()->attach($tag);

        return $image;
    }
}
