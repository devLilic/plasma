<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\User;
use App\Services\Images\ImageThumbnailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ImageThumbnailTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('images');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        Sanctum::actingAs($this->user);
    }

    public function test_thumbnail_is_640px_webp_with_preserved_aspect_ratio(): void
    {
        $storage = Storage::disk('images');
        $storage->put('library/landscape.jpg', $this->jpeg(1200, 600));

        $service = app(ImageThumbnailService::class);
        $thumbnailPath = $service->generate('library/landscape.jpg');
        $size = getimagesizefromstring($storage->get($thumbnailPath));

        $this->assertSame('.thumbnails/library/landscape.jpg.webp', $thumbnailPath);
        $this->assertSame([640, 320], [$size[0], $size[1]]);
        $this->assertSame(IMAGETYPE_WEBP, $size[2]);
        $this->assertTrue($service->isValid('library/landscape.jpg'));
    }

    public function test_thumbnail_does_not_upscale_a_small_original(): void
    {
        $storage = Storage::disk('images');
        $storage->put('small.jpg', $this->jpeg(180, 90));

        $thumbnailPath = app(ImageThumbnailService::class)->generate('small.jpg');
        $size = getimagesizefromstring($storage->get($thumbnailPath));

        $this->assertSame([180, 90], [$size[0], $size[1]]);
    }

    public function test_authenticated_thumbnail_route_self_heals_and_sets_cache_headers(): void
    {
        $image = Image::create(['url' => 'library/example.jpg']);
        Storage::disk('images')->put($image->url, $this->jpeg());

        $response = $this->get(route('images.thumbnail', ['path' => $image->url]));

        $response->assertOk()
            ->assertHeader('content-type', 'image/webp')
            ->assertHeader('cache-control', 'immutable, max-age=31536000, private')
            ->assertHeader('x-content-type-options', 'nosniff');
        $this->assertTrue(app(ImageThumbnailService::class)->isValid($image->url));
    }

    public function test_thumbnail_route_replaces_an_obsolete_low_resolution_variant(): void
    {
        $image = Image::create(['url' => 'library/example.jpg']);
        $storage = Storage::disk('images');
        $storage->put($image->url, $this->jpeg(1200, 600));
        $storage->put(app(ImageThumbnailService::class)->pathFor($image->url), $this->webp(300, 150));

        $this->get(route('images.thumbnail', ['path' => $image->url]))->assertOk();

        $size = getimagesizefromstring($storage->get(app(ImageThumbnailService::class)->pathFor($image->url)));
        $this->assertSame([640, 320], [$size[0], $size[1]]);
    }

    public function test_original_route_sets_long_lived_private_cache_headers(): void
    {
        $image = Image::create(['url' => 'library/example.jpg']);
        Storage::disk('images')->put($image->url, $this->jpeg());

        $this->get(route('images.file', ['path' => $image->url]))
            ->assertOk()
            ->assertHeader('cache-control', 'immutable, max-age=31536000, private')
            ->assertHeader('x-content-type-options', 'nosniff');
    }

    public function test_upload_generates_thumbnail_and_returns_its_versioned_url(): void
    {
        $response = $this->post('/api/v1/files', [
            'files' => [UploadedFile::fake()->image('photo.jpg', 1200, 800)],
        ]);

        $response->assertOk();
        $image = Image::query()->firstOrFail();

        $this->assertTrue(app(ImageThumbnailService::class)->isValid($image->url));
        $this->assertStringContainsString('/image-thumbnails/', $response->json('0.thumbnailUrl'));
        $this->assertStringContainsString('?v=', $response->json('0.thumbnailUrl'));
    }

    public function test_backfill_is_idempotent(): void
    {
        $image = Image::create(['url' => 'library/example.jpg']);
        Storage::disk('images')->put($image->url, $this->jpeg());

        $this->artisan('images:generate-thumbnails')
            ->expectsOutputToContain('Generate: 1; existente: 0; eșuate: 0.')
            ->assertSuccessful();

        $this->artisan('images:generate-thumbnails')
            ->expectsOutputToContain('Generate: 0; existente: 1; eșuate: 0.')
            ->assertSuccessful();
    }

    private function jpeg(int $width = 1200, int $height = 675): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, imagecolorallocate($image, 40, 120, 210));

        ob_start();
        imagejpeg($image, null, 90);
        $contents = (string) ob_get_clean();
        imagedestroy($image);

        return $contents;
    }

    private function webp(int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, imagecolorallocate($image, 40, 120, 210));

        ob_start();
        imagewebp($image, null, 82);
        $contents = (string) ob_get_clean();
        imagedestroy($image);

        return $contents;
    }
}
