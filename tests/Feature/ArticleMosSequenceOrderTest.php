<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\ArticleMosSequenceOrder;
use App\Models\Playlist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleMosSequenceOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_manual_order_and_cross_separator_positions_are_saved_per_article(): void
    {
        [$playlist, $article] = $this->makeArticle();

        $this->patchJson(route('playlists.mos-order.update', [$playlist->id, $article->id]), [
            'entryOrder' => ['mos:ion:1', 'mos:elena:1', 'mos:ion:2'],
            'entryZones' => ['mos:elena:1' => 'before'],
        ])->assertOk()->assertJsonPath('data.entryOrder.0', 'mos:ion:1')
            ->assertJsonPath('data.entryZones.mos:elena:1', 'before');

        $this->assertDatabaseHas('article_mos_sequence_orders', ['article_id' => $article->id]);
        $this->assertSame(['mos:ion:1', 'mos:elena:1', 'mos:ion:2'], app(\App\Services\Articles\ArticleMosSequenceOrderService::class)->forArticle($article)['entryOrder']);
    }

    public function test_order_route_rejects_an_article_from_another_playlist_and_duplicate_entry_keys(): void
    {
        [$playlist, $article] = $this->makeArticle();
        $otherPlaylist = Playlist::create(['title' => 'Alt playlist']);

        $this->patchJson(route('playlists.mos-order.update', [$otherPlaylist->id, $article->id]), [
            'entryOrder' => ['mos:ion:1'], 'entryZones' => [],
        ])->assertNotFound();

        $this->patchJson(route('playlists.mos-order.update', [$playlist->id, $article->id]), [
            'entryOrder' => ['mos:ion:1', 'mos:ion:1'], 'entryZones' => [],
        ])->assertUnprocessable();
    }

    public function test_deleting_the_article_cascades_its_saved_manual_order(): void
    {
        [$playlist, $article] = $this->makeArticle();
        ArticleMosSequenceOrder::query()->create([
            'article_id' => $article->id,
            'entry_order' => ['mos:ion:1'],
            'entry_zones' => [],
        ]);

        $article->delete();

        $this->assertDatabaseMissing('article_mos_sequence_orders', ['article_id' => $article->id]);
    }

    private function makeArticle(): array
    {
        $playlist = Playlist::create(['title' => 'Ordine MOS']);
        $article = $playlist->articles()->create([
            'title' => 'Știre', 'subtitle' => 'Știre', 'article_type' => 'BETA', 'playlist_order' => 1,
        ]);

        return [$playlist, $article];
    }
}
