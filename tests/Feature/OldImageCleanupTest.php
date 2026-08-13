<?php

namespace Tests\Feature;

use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OldImageCleanupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('images');
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_scan_returns_only_images_unused_for_more_than_two_months(): void
    {
        $old = Image::create(['url' => 'old.jpg', 'last_used_at' => now()->subMonths(3)]);
        Image::create(['url' => 'recent.jpg', 'last_used_at' => now()->subMonth()]);

        $this->getJson('/api/v1/images/stale')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $old->id)
            ->assertJsonPath('0.lastUsedAt', $old->last_used_at->toISOString());
    }

    public function test_image_resource_serializes_a_string_last_used_at_value(): void
    {
        $image = Image::create([
            'url' => 'string-date.jpg',
            'last_used_at' => '2026-05-10 12:30:00',
        ]);
        $image->mergeCasts(['last_used_at' => 'string']);

        $this->assertSame('2026-05-10 12:30:00', $image->last_used_at);
        $this->assertSame(
            '2026-05-10T12:30:00.000000Z',
            ImageResource::make($image)->resolve()['lastUsedAt'],
        );
    }

    public function test_cleanup_deletes_only_selected_stale_images_and_preserves_tags(): void
    {
        $selected = Image::create(['url' => 'selected-old.jpg', 'last_used_at' => now()->subMonths(3)]);
        $unselected = Image::create(['url' => 'unselected-old.jpg', 'last_used_at' => now()->subMonths(4)]);
        $recent = Image::create(['url' => 'recent.jpg', 'last_used_at' => now()->subMonth()]);
        $tag = Tag::create(['title' => 'arhivă']);
        $selected->tags()->attach($tag);
        Storage::disk('images')->put($selected->url, 'selected');
        Storage::disk('images')->put($unselected->url, 'unselected');
        Storage::disk('images')->put($recent->url, 'recent');
        $playlist = Playlist::create(['title' => 'Jurnal']);
        $article = Article::create([
            'title' => 'Titlu',
            'subtitle' => 'Subtitlu',
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
            'image_id' => $selected->id,
        ]);

        $this->deleteJson('/api/v1/images/stale', [
            'data' => ['image_ids' => [$selected->id, $recent->id]],
        ])->assertOk()->assertJsonPath('deleted_ids.0', $selected->id);

        $this->assertDatabaseMissing('images', ['id' => $selected->id]);
        $this->assertDatabaseHas('images', ['id' => $unselected->id]);
        $this->assertDatabaseHas('images', ['id' => $recent->id]);
        $this->assertDatabaseHas('tags', ['id' => $tag->id, 'title' => 'arhivă']);
        $this->assertDatabaseMissing('image_tag', ['image_id' => $selected->id]);
        $this->assertNull($article->refresh()->image_id);
        Storage::disk('images')->assertMissing($selected->url);
        Storage::disk('images')->assertExists($unselected->url);
        Storage::disk('images')->assertExists($recent->url);
    }
}
