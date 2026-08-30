<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Models\Tag;
use App\Models\User;
use App\Services\Images\ExternalImageService;
use App\Services\Images\ImageThumbnailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ImageManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('images');
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_saved_image_tags_can_be_replaced(): void
    {
        $image = Image::create(['url' => 'library/example.jpg', 'sourceUrl' => 'https://example.com/original.jpg']);
        $image->forceFill(['updated_at' => now()->subDay()])->saveQuietly();
        $contentVersion = $image->fresh()->updated_at->getTimestamp();
        $oldTag = Tag::create(['title' => 'vechi']);
        $image->tags()->attach($oldTag);

        $this->patchJson("/api/v1/images/{$image->id}", [
            'data' => ['tags' => 'energie, moldova'],
        ])->assertOk()
            ->assertJsonPath('id', $image->id)
            ->assertJsonCount(2, 'tags');

        $this->assertDatabaseMissing('image_tag', ['image_id' => $image->id, 'tag_id' => $oldTag->id]);
        $this->assertDatabaseHas('tags', ['title' => 'energie']);
        $this->assertDatabaseHas('tags', ['title' => 'moldova']);
        $this->assertSame($contentVersion, $image->fresh()->updated_at->getTimestamp());
    }

    public function test_deleting_image_unassigns_articles_and_removes_file(): void
    {
        $image = Image::create(['url' => 'library/example.jpg']);
        $tag = Tag::create(['title' => 'energie']);
        $image->tags()->attach($tag);
        Storage::disk('images')->put($image->url, 'image-bytes');
        $thumbnailPath = app(ImageThumbnailService::class)->pathFor($image->url);
        Storage::disk('images')->put($thumbnailPath, 'thumbnail-bytes');
        $playlist = Playlist::create(['title' => 'Jurnal']);
        $article = Article::create([
            'title' => 'Titlu',
            'subtitle' => 'Subtitlu',
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
            'image_id' => $image->id,
        ]);

        $this->deleteJson("/api/v1/images/{$image->id}")
            ->assertOk()
            ->assertJsonPath('id', $image->id);

        $this->assertDatabaseMissing('images', ['id' => $image->id]);
        $this->assertDatabaseHas('tags', ['id' => $tag->id, 'title' => 'energie']);
        $this->assertDatabaseMissing('image_tag', ['image_id' => $image->id]);
        $this->assertNull($article->refresh()->image_id);
        Storage::disk('images')->assertMissing('library/example.jpg');
        Storage::disk('images')->assertMissing($thumbnailPath);
    }

    public function test_recrop_request_does_not_change_existing_tags(): void
    {
        $this->mock(ExternalImageService::class)
            ->shouldReceive('crop')
            ->once()
            ->andReturn($this->jpeg());

        $image = Image::create(['url' => 'library/example.jpg', 'sourceUrl' => 'https://example.com/source.jpg']);
        $tag = Tag::create(['title' => 'existent']);
        $image->tags()->attach($tag);

        $this->patchJson("/api/v1/images/{$image->id}", [
            'data' => ['section' => ['unit' => '%', 'x' => 0, 'y' => 0, 'width' => 100, 'height' => 56.25]],
        ])->assertOk();

        $this->assertDatabaseHas('image_tag', ['image_id' => $image->id, 'tag_id' => $tag->id]);
        $this->assertTrue(app(ImageThumbnailService::class)->isValid($image->url));
    }

    public function test_tag_suggestions_match_fragment(): void
    {
        Tag::create(['title' => 'energie']);
        Tag::create(['title' => 'energetica']);
        Tag::create(['title' => 'politica']);

        $this->getJson('/api/v1/tags?query=energ')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['title' => 'energie'])
            ->assertJsonMissing(['title' => 'politica']);
    }

    public function test_local_image_upload_saves_the_original_and_thumbnail(): void
    {
        $response = $this->post('/api/v1/files', [
            'files' => [UploadedFile::fake()->image('dubai.jpg', 1600, 1067)],
        ]);

        $response->assertOk()
            ->assertJsonCount(1);

        $image = Image::query()->sole();
        Storage::disk('images')->assertExists($image->url);
        Storage::disk('images')->assertExists(app(ImageThumbnailService::class)->pathFor($image->url));
    }

    public function test_external_image_with_a_long_source_url_can_be_saved(): void
    {
        $this->mock(ExternalImageService::class)
            ->shouldReceive('crop')
            ->once()
            ->andReturn($this->jpeg());

        $playlist = Playlist::create(['title' => 'Jurnal']);
        $article = Article::create([
            'title' => 'Titlu',
            'subtitle' => 'Subtitlu',
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
            'playlist_order' => 1,
        ]);
        $sourceUrl = 'https://example.com/'.str_repeat('very-long-image-path/', 20).'image.jpg';

        $this->postJson('/api/v1/crop', [
            'data' => [
                'url' => $sourceUrl,
                'section' => ['unit' => '%', 'x' => 0, 'y' => 0, 'width' => 100, 'height' => 56.25],
                'tags' => 'energie',
                'article_id' => $article->id,
            ],
        ])->assertCreated()
            ->assertJsonPath('sourceUrl', $sourceUrl);

        $this->assertGreaterThan(255, strlen($sourceUrl));
        $this->assertDatabaseHas('images', ['sourceUrl' => $sourceUrl]);
        $this->assertNotNull($article->refresh()->image_id);
        $this->assertTrue(app(ImageThumbnailService::class)->isValid($article->image->url));
    }

    private function jpeg(int $width = 1200, int $height = 675): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, imagecolorallocate($image, 36, 96, 180));

        ob_start();
        imagejpeg($image, null, 90);
        $contents = (string) ob_get_clean();
        imagedestroy($image);

        return $contents;
    }
}
