<?php

namespace Tests\Feature;

use App\Models\ApplicationSetting;
use App\Models\Image;
use App\Models\User;
use App\Services\Images\ImageStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ImageStorageSettingsTest extends TestCase
{
    use RefreshDatabase;

    private string $storagePath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->storagePath = storage_path('framework/testing/configured-images');
        File::ensureDirectoryExists($this->storagePath);
        $this->actingAs(User::factory()->create());
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->storagePath);
        parent::tearDown();
    }

    public function test_user_can_configure_a_writable_image_storage_folder(): void
    {
        $this->patch(route('profile.image-storage.update'), ['path' => $this->storagePath])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(
            realpath($this->storagePath),
            ApplicationSetting::query()->where('key', ImageStorage::SETTING_KEY)->value('value'),
        );
    }

    public function test_invalid_image_storage_folder_is_rejected(): void
    {
        $this->from(route('profile.edit'))
            ->patch(route('profile.image-storage.update'), ['path' => $this->storagePath.'-missing'])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHasErrors('path');

        $this->assertDatabaseCount('application_settings', 0);
    }

    public function test_configured_folder_is_used_and_images_are_served_by_laravel(): void
    {
        ApplicationSetting::create([
            'key' => ImageStorage::SETTING_KEY,
            'value' => realpath($this->storagePath),
        ]);
        $image = Image::create(['url' => 'configured.jpg']);
        app(ImageStorage::class)->disk()->put($image->url, 'configured-image-contents');

        $this->assertFileExists($this->storagePath.DIRECTORY_SEPARATOR.$image->url);
        $response = $this->get(route('images.file', ['path' => $image->url]));

        $response->assertOk();
        $this->assertSame('configured-image-contents', $response->streamedContent());
    }
}
