<?php

namespace Tests\Feature;

use App\Models\Playlist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTextHighlightTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_a_sanitized_html_highlight_without_changing_article_text(): void
    {
        $this->actingAs(User::factory()->create());
        $article = Playlist::create(['title' => 'Jurnal'])->articles()->create([
            'title' => 'Material',
            'subtitle' => 'Material',
            'article_type' => 'BETA',
            'playlist_order' => 1,
            'content_sections' => [['slug' => 'INTRO', 'type' => 'INTRO', 'paragraphs' => ['Acesta este textul știrii.']]],
        ]);

        $this->patchJson("/api/v1/articles/{$article->id}/highlights", [
            'data' => [
                'section_index' => 0,
                'paragraph_index' => 0,
                'html' => 'Acesta este <strong class="anything">textul</strong> știrii.',
            ],
        ])->assertOk();

        $this->assertSame(
            'Acesta este <strong data-onair-highlight="true" style="font-weight: 800; background-color: #ffcc0073; padding: 0 2px; border-radius: 2px;">textul</strong> știrii.',
            $article->fresh()->content_sections[0]['paragraphs'][0],
        );
    }

    public function test_highlighting_old_enps_text_accepts_normalized_word_spacing(): void
    {
        $this->actingAs(User::factory()->create());
        $article = Playlist::create(['title' => 'Jurnal'])->articles()->create([
            'title' => 'Material',
            'subtitle' => 'Material',
            'article_type' => 'OFF',
            'playlist_order' => 1,
            'content_sections' => [['slug' => 'INTRO', 'type' => 'INTRO', 'paragraphs' => ["Helsinki\u{00A0}și\u{202F}Finlanda dis\u{00AD}cută."]]],
        ]);

        $this->patchJson("/api/v1/articles/{$article->id}/highlights", [
            'data' => ['section_index' => 0, 'paragraph_index' => 0, 'html' => '<strong>Helsinki și Finlanda</strong> discută.'],
        ])->assertOk();

        $this->patchJson("/api/v1/articles/{$article->id}/highlights", [
            'data' => ['section_index' => 0, 'paragraph_index' => 0, 'html' => '<strong>Helsinki și România</strong> discută.'],
        ])->assertUnprocessable();
    }

    public function test_it_rejects_highlight_requests_that_change_article_text(): void
    {
        $this->actingAs(User::factory()->create());
        $article = Playlist::create(['title' => 'Jurnal'])->articles()->create([
            'title' => 'Material',
            'subtitle' => 'Material',
            'article_type' => 'BETA',
            'playlist_order' => 1,
            'content_sections' => [['slug' => 'INTRO', 'type' => 'INTRO', 'paragraphs' => ['Text original.']]],
        ]);

        $this->patchJson("/api/v1/articles/{$article->id}/highlights", [
            'data' => ['section_index' => 0, 'paragraph_index' => 0, 'html' => '<strong>Text modificat.</strong>'],
        ])->assertUnprocessable();

        $this->assertSame('Text original.', $article->fresh()->content_sections[0]['paragraphs'][0]);
    }

    public function test_it_persists_removal_of_an_existing_highlight(): void
    {
        $this->actingAs(User::factory()->create());
        $article = Playlist::create(['title' => 'Jurnal'])->articles()->create([
            'title' => 'Material',
            'subtitle' => 'Material',
            'article_type' => 'BETA',
            'playlist_order' => 1,
            'content_sections' => [['slug' => 'INTRO', 'type' => 'INTRO', 'paragraphs' => ['Text <strong data-onair-highlight="true">evidențiat</strong>.']]],
        ]);

        $this->patchJson("/api/v1/articles/{$article->id}/highlights", [
            'data' => ['section_index' => 0, 'paragraph_index' => 0, 'html' => 'Text evidențiat.'],
        ])->assertOk();

        $this->assertSame('Text evidențiat.', $article->fresh()->content_sections[0]['paragraphs'][0]);
    }
}
