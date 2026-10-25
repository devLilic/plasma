<?php

namespace Tests\Feature;

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Services\Articles\NameGraphicTemplates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NameGraphicTemplatesSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_displays_default_name_graphic_template_and_it_can_be_updated(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get('/profile')->assertOk();
        $this->assertSame(['02_Nume'], app(NameGraphicTemplates::class)->templates());

        $this->actingAs($user)->patch(route('profile.mos-name-graphics.update'), [
            'templates' => ['02_Nume', '09_Nume_Fullscreen', ' 02_Nume '],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame(['02_Nume', '09_Nume_Fullscreen'], app(NameGraphicTemplates::class)->templates());
        $this->assertSame(1, ApplicationSetting::query()->where('key', NameGraphicTemplates::SETTING_KEY)->count());
    }
}
