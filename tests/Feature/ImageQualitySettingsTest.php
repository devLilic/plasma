<?php

namespace Tests\Feature;

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Services\Images\ImageQualitySettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ImageQualitySettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_settings_page_exposes_default_image_dimensions(): void
    {
        $this->get(route('profile.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('imageMinimumDimensions', ['width' => 700, 'height' => 400]));
    }

    public function test_user_can_update_minimum_image_dimensions(): void
    {
        $this->patch(route('profile.image-quality.update'), ['width' => 900, 'height' => 500])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(['width' => 900, 'height' => 500], app(ImageQualitySettings::class)->dimensions());
        $this->assertDatabaseHas('application_settings', [
            'key' => ImageQualitySettings::SETTING_KEY,
            'value' => '{"width":900,"height":500}',
        ]);
    }

    public function test_invalid_dimensions_are_rejected_without_saving(): void
    {
        $this->from(route('profile.edit'))
            ->patch(route('profile.image-quality.update'), ['width' => 0, 'height' => 12000])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHasErrors(['width', 'height']);

        $this->assertDatabaseMissing('application_settings', ['key' => ImageQualitySettings::SETTING_KEY]);
    }

    public function test_guests_cannot_change_minimum_image_dimensions(): void
    {
        auth()->logout();

        $this->patch(route('profile.image-quality.update'), ['width' => 900, 'height' => 500])
            ->assertRedirect(route('login'));

        $this->assertDatabaseMissing('application_settings', ['key' => ImageQualitySettings::SETTING_KEY]);
    }
}
