<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Models\User;
use App\Services\PlasmaViewer\PlasmaViewerLauncher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class PlasmaViewerIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'plasma_viewer.host' => '127.0.0.1',
            'plasma_viewer.port' => 47832,
            'plasma_viewer.token' => 'test-viewer-token',
            'plasma_viewer.launch_enabled' => false,
        ]);
    }

    public function test_authenticated_operator_can_read_viewer_state(): void
    {
        Http::fake(['http://127.0.0.1:47832/v1/state' => Http::response($this->viewerState())]);

        $this->actingAs(User::factory()->create())
            ->getJson(route('viewer.state'))
            ->assertOk()
            ->assertJsonPath('transform.zoom', 1);

        Http::assertSent(fn (Request $request) => $request->hasHeader('Authorization', 'Bearer test-viewer-token'));
    }

    public function test_offline_viewer_is_launched_and_the_request_is_retried(): void
    {
        $launcher = \Mockery::mock(PlasmaViewerLauncher::class);
        $launcher->shouldReceive('launch')->once();
        $this->app->instance(PlasmaViewerLauncher::class, $launcher);
        config(['plasma_viewer.launch_enabled' => true]);
        Http::fakeSequence()
            ->pushFailedConnection('offline')
            ->push($this->viewerState());

        $this->actingAs(User::factory()->create())
            ->getJson(route('viewer.state'))
            ->assertOk();
    }

    public function test_show_command_is_built_server_side_with_signed_media_url(): void
    {
        Storage::fake('images');
        $image = Image::create(['url' => 'library/on-air.jpg']);
        Storage::disk('images')->put($image->url, 'image-bytes');
        $article = Article::create([
            'title' => 'Titlu jurnal', 'subtitle' => 'Slug', 'article_type' => 'BETA',
            'playlist_id' => Playlist::create(['title' => 'Jurnal'])->id, 'playlist_order' => 1, 'image_id' => $image->id,
        ]);
        Http::fake(['http://127.0.0.1:47832/v1/commands' => Http::response($this->viewerState())]);

        $this->actingAs(User::factory()->create())->postJson(route('viewer.command'), [
            'type' => 'show', 'article_id' => $article->id,
            'transform' => ['brightness' => 90, 'zoom' => 1.2, 'panX' => 4, 'panY' => -3, 'flipX' => true],
            'url' => 'https://attacker.example/image.jpg',
            'executable' => 'C:\\attacker.exe',
        ])->assertOk();

        Http::assertSent(function (Request $request) use ($article, $image) {
            $command = $request->data();
            $url = $command['payload']['image']['url'];
            return $command['version'] === 1
                && $command['type'] === 'show'
                && $command['payload']['image']['articleId'] === $article->id
                && $command['payload']['image']['imageId'] === $image->id
                && str_contains($url, '/viewer/media/')
                && ! str_contains($url, 'attacker.example');
        });
    }

    public function test_signed_media_route_serves_only_the_articles_current_image(): void
    {
        Storage::fake('images');
        $image = Image::create(['url' => 'library/current.jpg']);
        $other = Image::create(['url' => 'library/other.jpg']);
        Storage::disk('images')->put($image->url, 'current-image');
        Storage::disk('images')->put($other->url, 'other-image');
        $article = Article::create([
            'title' => 'Titlu', 'subtitle' => 'Slug', 'article_type' => 'BETA',
            'playlist_id' => Playlist::create(['title' => 'Jurnal'])->id, 'playlist_order' => 1, 'image_id' => $image->id,
        ]);

        $validUrl = URL::temporarySignedRoute('viewer.media', now()->addMinute(), ['article' => $article, 'image' => $image]);
        $wrongUrl = URL::temporarySignedRoute('viewer.media', now()->addMinute(), ['article' => $article, 'image' => $other]);

        $this->get($validUrl)->assertOk();
        $this->get($wrongUrl)->assertNotFound();
        $this->get(route('viewer.media', ['article' => $article, 'image' => $image]))->assertForbidden();
    }

    public function test_commands_require_authentication_and_valid_transform_limits(): void
    {
        $this->postJson(route('viewer.command'), ['type' => 'hide'])->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson(route('viewer.command'), [
            'type' => 'transform',
            'transform' => ['brightness' => 300, 'zoom' => 0, 'panX' => 0, 'panY' => 0, 'flipX' => false],
        ])->assertUnprocessable();
    }

    private function viewerState(): array
    {
        return [
            'visible' => false, 'activeImage' => null,
            'transform' => ['brightness' => 100, 'zoom' => 1, 'panX' => 0, 'panY' => 0, 'flipX' => false],
            'window' => ['displayId' => null, 'fullscreen' => true, 'topmost' => false],
            'displays' => [], 'lastCommandId' => null, 'error' => null,
        ];
    }
}
