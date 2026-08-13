<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlaylistDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_a_playlist_removes_articles_but_preserves_images_and_tags(): void
    {
        $user = User::factory()->create();
        $playlist = Playlist::create(['title' => 'Jurnal']);
        $image = Image::create(['url' => 'library/preserved.jpg']);
        $tag = Tag::create(['title' => 'energie']);
        $image->tags()->attach($tag);
        $article = Article::create([
            'title' => 'Titlu',
            'subtitle' => 'Subtitlu',
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
            'image_id' => $image->id,
        ]);

        $this->actingAs($user)
            ->delete(route('playlists.destroy', $playlist))
            ->assertRedirect(route('playlists.index'));

        $this->assertDatabaseMissing('playlists', ['id' => $playlist->id]);
        $this->assertDatabaseMissing('articles', ['id' => $article->id]);
        $this->assertDatabaseHas('images', ['id' => $image->id, 'url' => 'library/preserved.jpg']);
        $this->assertDatabaseHas('tags', ['id' => $tag->id, 'title' => 'energie']);
        $this->assertDatabaseHas('image_tag', ['image_id' => $image->id, 'tag_id' => $tag->id]);
    }
}
