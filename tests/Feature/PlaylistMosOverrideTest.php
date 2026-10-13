<?php

namespace Tests\Feature;

use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Playlist;
use App\Models\PlaylistMosOverride;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlaylistMosOverrideTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_override_survives_source_refresh_uses_empty_values_and_rejects_stale_source_revision(): void
    {
        [$playlist, $article, $objects] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Titlu vechi')],
        ]);
        $service = app(\App\Services\Articles\MosOverrideService::class);
        $before = $service->objectsForArticle($article)[0];
        $this->assertTrue($before['editable']);
        $this->assertSame('Titlu vechi', $before['editableObjects'][0]['importedValue']);

        $saved = $service->update($playlist, $before['objectKey'], $before['revision'], [
            ['fieldKey' => $before['editableObjects'][0]['fieldKey'], 'value' => ''],
        ], false);
        $this->assertSame('', $saved['editableObjects'][0]['value']);
        $this->assertTrue($saved['editableObjects'][0]['isOverridden']);
        $this->assertFalse($saved['editableObjects'][0]['sourceChanged']);

        $updated = $objects[0];
        $updated['editableObjects'][0]['value'] = 'Titlu nou ENPS';
        $article->update(['mos_objects' => [$updated]]);
        $playlist->enpsItems()->delete();
        $this->addSource($playlist, 'record-1', 'STORY-BETA', $updated, 'BETA Titlu nou ENPS');

        $after = $service->objectsForArticle($article->fresh())[0];
        $this->assertSame($before['objectKey'], $after['objectKey']);
        $this->assertSame($before['editableObjects'][0]['fieldKey'], $after['editableObjects'][0]['fieldKey']);
        $this->assertSame('Titlu nou ENPS', $after['editableObjects'][0]['importedValue']);
        $this->assertSame('', $after['editableObjects'][0]['value']);
        $this->assertTrue($after['editableObjects'][0]['sourceChanged']);
        $this->assertSame('Titlu nou ENPS', $article->fresh()->mos_objects[0]['editableObjects'][0]['value']);
        $this->assertNotSame($saved['revision'], $after['revision']);

        $this->patchJson(route('playlists.mos.update', [$playlist->id, $after['objectKey']]), [
            'revision' => $saved['revision'],
            'fields' => [['fieldKey' => $after['editableObjects'][0]['fieldKey'], 'value' => 'Stale']],
            'applyToMembers' => false,
        ])->assertStatus(409)->assertJsonPath('current.objectKey', $after['objectKey']);
        $this->assertSame('', $service->objectsForArticle($article->fresh())[0]['editableObjects'][0]['value']);
    }

    public function test_duplicate_timeline_titles_keep_independent_keys_and_group_edit_updates_all_members(): void
    {
        $first = $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Același titlu');
        $second = $this->graphic('command-2', 'item-2', 'object-2', '01_Titlu', 'Același titlu');
        [$playlist, $article] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $first],
            ['guid' => 'record-2', 'slug' => 'STORY-OFF', 'object' => $second],
        ]);
        $service = app(\App\Services\Articles\MosOverrideService::class);
        $objects = $service->objectsForArticle($article);
        $this->assertNotSame($objects[0]['objectKey'], $objects[1]['objectKey']);
        $this->assertSame([$objects[0]['objectKey'], $objects[1]['objectKey']], $objects[0]['memberObjectKeys']);
        $this->assertSame($objects[0]['memberObjectKeys'], $objects[1]['memberObjectKeys']);
        $this->assertSame($objects[0]['revision'], $objects[1]['revision']);

        $resource = ArticleResource::make($article)->resolve();
        $this->assertCount(1, array_filter($resource['mos_timeline'], fn ($entry) => $entry['kind'] === 'mos'));
        $timelineBefore = array_map(fn ($entry) => array_intersect_key($entry, array_flip(['kind', 'position', 'sourceLine', 'count', 'snippet'])), $resource['mos_timeline']);
        $saved = $service->update($playlist, $objects[0]['objectKey'], $objects[0]['revision'], [
            ['fieldKey' => $objects[0]['editableObjects'][0]['fieldKey'], 'value' => 'Corectat local'],
        ], true);
        $this->assertSame('Corectat local', $saved['editableObjects'][0]['value']);
        $this->assertSame('Corectat local', $service->objectsForArticle($article->fresh())[1]['editableObjects'][0]['value']);

        $resourceAfter = ArticleResource::make($article->fresh())->resolve();
        $timelineAfter = array_map(fn ($entry) => array_intersect_key($entry, array_flip(['kind', 'position', 'sourceLine', 'count', 'snippet'])), $resourceAfter['mos_timeline']);
        $this->assertSame($timelineBefore, $timelineAfter);
        $this->assertCount(1, array_filter($resourceAfter['mos_timeline'], fn ($entry) => $entry['kind'] === 'mos'));
        $timelineMos = array_values(array_filter($resourceAfter['mos_timeline'], fn ($entry) => $entry['kind'] === 'mos'))[0];
        $this->assertCount(2, $timelineMos['object']['memberObjectKeys']);
        $this->assertSame('Corectat local', $timelineMos['object']['editableObjects'][0]['value']);
    }

    public function test_changed_object_identity_becomes_inactive_orphan_and_can_be_deleted_without_value_remapping(): void
    {
        [$playlist, $article, $objects] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $this->graphic('command-1', 'item-1', 'object-1', '02_Nume', 'Nume importat')],
        ]);
        $service = app(\App\Services\Articles\MosOverrideService::class);
        $old = $service->objectsForArticle($article)[0];
        $service->update($playlist, $old['objectKey'], $old['revision'], [
            ['fieldKey' => $old['editableObjects'][0]['fieldKey'], 'value' => 'Corectat local'],
        ], false);

        $replacement = $objects[0];
        $replacement['commandId'] = 'command-new';
        $replacement['objectId'] = 'object-new';
        $replacement['editableObjects'][0]['value'] = 'Nume importat';
        $article->update(['mos_objects' => [$replacement]]);
        $playlist->enpsItems()->delete();
        $this->addSource($playlist, 'record-1', 'STORY-BETA', $replacement, 'Nume importat');

        $current = $service->objectsForArticle($article->fresh())[0];
        $this->assertNotSame($old['objectKey'], $current['objectKey']);
        $this->assertSame('Nume importat', $current['editableObjects'][0]['value']);
        $orphans = $service->orphanOverrides($playlist);
        $this->assertCount(1, $orphans);
        $this->assertSame($old['objectKey'], $orphans[0]['objectKey']);
        $this->assertSame('Corectat local', $orphans[0]['value']);
        $this->deleteJson(route('playlists.mos-overrides.destroy', [$playlist->id, $orphans[0]['id']]))->assertOk();
        $this->assertSame(0, PlaylistMosOverride::query()->where('playlist_id', $playlist->id)->count());
    }

    public function test_http_update_preserves_empty_and_whitespace_values_and_reset_uses_revision(): void
    {
        [$playlist, $article] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Titlu importat')],
        ]);
        $service = app(\App\Services\Articles\MosOverrideService::class);
        $object = $service->objectsForArticle($article)[0];
        $fieldKey = $object['editableObjects'][0]['fieldKey'];

        $empty = $this->patchJson(route('playlists.mos.update', [$playlist->id, $object['objectKey']]), [
            'revision' => $object['revision'],
            'fields' => [['fieldKey' => $fieldKey, 'value' => '']],
            'applyToMembers' => false,
        ])->assertOk()->json('data');
        $this->assertSame('', $empty['editableObjects'][0]['value']);
        $this->assertTrue($empty['editableObjects'][0]['isOverridden']);

        $whitespace = "  Titlu cu spații\nși diacritice  ";
        $this->patchJson(route('playlists.mos.update', [$playlist->id, $object['objectKey']]), [
            'revision' => $empty['revision'],
            'fields' => [['fieldKey' => $fieldKey, 'value' => $whitespace]],
            'applyToMembers' => false,
        ])->assertOk()->assertJsonPath('data.editableObjects.0.value', $whitespace);

        $current = $service->objectsForArticle($article->fresh())[0];
        $reset = $this->deleteJson(route('playlists.mos.reset', [$playlist->id, $object['objectKey']]), [
            'revision' => $current['revision'],
            'applyToMembers' => false,
        ])->assertOk()->json('data');
        $this->assertSame('Titlu importat', $reset['editableObjects'][0]['value']);
        $this->assertFalse($reset['editableObjects'][0]['isOverridden']);
    }

    public function test_update_rejects_a_field_key_from_another_object_and_duplicate_field_names_are_read_only(): void
    {
        [$playlist, $article] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Titlu 1')],
            ['guid' => 'record-2', 'slug' => 'STORY-OFF', 'object' => $this->graphic('command-2', 'item-2', 'object-2', '02_Nume', 'Nume 2')],
        ]);
        $service = app(\App\Services\Articles\MosOverrideService::class);
        [$first, $second] = $service->objectsForArticle($article);

        $this->patchJson(route('playlists.mos.update', [$playlist->id, $first['objectKey']]), [
            'revision' => $first['revision'],
            'fields' => [['fieldKey' => $second['editableObjects'][0]['fieldKey'], 'value' => 'Intrus']],
            'applyToMembers' => false,
        ])->assertStatus(422);
        $this->assertSame('Titlu 1', $service->objectsForArticle($article)[0]['editableObjects'][0]['value']);

        $duplicate = $this->graphic('command-3', 'item-3', 'object-3', '01_Titlu', 'Valoare');
        $duplicate['editableObjects'][] = ['type' => 'TEXT', 'name' => 'titlu', 'value' => 'Altă valoare'];
        $article->update(['mos_objects' => [$duplicate]]);
        $this->addSource($playlist, 'record-3', 'STORY-BETA', $duplicate, 'Valoare');
        $readOnly = $service->objectsForArticle($article->fresh())[0];
        $this->assertFalse($readOnly['editable']);
        $this->assertNull($readOnly['editableObjects'][0]['fieldKey']);
        $this->assertNull($readOnly['editableObjects'][1]['fieldKey']);
    }

    public function test_object_identity_survives_field_order_and_name_changes(): void
    {
        $object = $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Titlu importat');
        $object['editableObjects'][] = ['type' => 'TEXT', 'name' => 'NUME', 'value' => 'Nume importat'];
        [$playlist, $article] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $object],
        ]);
        $service = app(\App\Services\Articles\MosOverrideService::class);
        $initial = $service->objectsForArticle($article)[0];

        $changed = $object;
        $changed['editableObjects'] = [
            ['type' => 'TEXT', 'name' => 'Nume', 'value' => 'Nume nou'],
            ['type' => 'TEXT', 'name' => 'Titlu', 'value' => 'Titlu nou'],
        ];
        $article->update(['mos_objects' => [$changed]]);

        $current = $service->objectsForArticle($article->fresh())[0];
        $this->assertSame($initial['objectKey'], $current['objectKey']);
        $this->assertTrue($current['editable']);
        $this->assertSame(['Nume', 'Titlu'], array_column($current['editableObjects'], 'name'));
    }

    public function test_playlist_deletion_cascades_local_overrides(): void
    {
        [$playlist, $article] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Titlu importat')],
        ]);
        $object = app(\App\Services\Articles\MosOverrideService::class)->objectsForArticle($article)[0];
        app(\App\Services\Articles\MosOverrideService::class)->update($playlist, $object['objectKey'], $object['revision'], [
            ['fieldKey' => $object['editableObjects'][0]['fieldKey'], 'value' => 'Corectat'],
        ], false);
        $this->assertSame(1, PlaylistMosOverride::query()->count());

        $playlist->delete();

        $this->assertSame(0, PlaylistMosOverride::query()->count());
    }

    public function test_ambiguous_source_object_is_read_only_and_resource_exposes_no_source_payload(): void
    {
        $object = $this->graphic('command-1', 'item-1', 'object-1', '01_Titlu', 'Titlu importat');
        [$playlist, $article] = $this->makeArticleWithObjects([
            ['guid' => 'record-1', 'slug' => 'STORY-BETA', 'object' => $object],
        ]);
        // A corrupt/legacy aggregate can repeat one source identity. It must be
        // visible but not editable until the source ambiguity is resolved.
        $article->update(['mos_objects' => [$object, $object]]);

        $resource = ArticleResource::make($article->fresh())->resolve();
        $this->assertFalse($resource['mos_objects'][0]['editable']);
        $this->assertNull($resource['mos_objects'][0]['objectKey']);
        $this->assertFalse($resource['mos_objects'][1]['editable']);
        $this->assertNull($resource['mos_objects'][1]['objectKey']);
        $this->assertArrayNotHasKey('itemId', $resource['mos_objects'][0]);
        $this->assertArrayNotHasKey('objectId', $resource['mos_objects'][0]);
        $this->assertArrayNotHasKey('source_guid', $resource['mos_objects'][0]);
        $this->assertArrayNotHasKey('basic_content', $resource['mos_objects'][0]);
    }

    private function makeArticleWithObjects(array $records): array
    {
        $playlist = Playlist::create(['title' => 'ENPS overrides', 'source_type' => 'enps']);
        $objects = array_column($records, 'object');
        $article = $playlist->articles()->create([
            'title' => 'Știre', 'subtitle' => 'Știre', 'technical_title' => 'MD ȘTIRE',
            'slugs' => implode('||', array_column($records, 'slug')), 'article_type' => 'BETA',
            'article_types' => ['BETA', 'OFF'], 'playlist_order' => 1, 'mos_objects' => $objects,
            'content_sections' => [['slug' => 'STORY-BETA', 'type' => 'BETA', 'paragraphs' => ['Text importat.']]],
        ]);
        foreach ($records as $record) {
            $this->addSource($playlist, $record['guid'], $record['slug'], $record['object'], $record['object']['editableObjects'][0]['value']);
        }

        return [$playlist, $article, $objects];
    }

    private function addSource(Playlist $playlist, string $guid, string $slug, array $object, string $scriptText): void
    {
        $playlist->enpsItems()->create([
            'position' => $playlist->enpsItems()->count() + 1,
            'script_order' => $playlist->enpsItems()->count() + 1,
            'source_database' => 'NEWS', 'source_path' => 'P_NEWS\\W\\R_playlist',
            'source_guid' => $guid, 'slug' => $slug,
            'basic_content' => ['ObjectProperties' => [
                ['FieldName' => 'Text', 'FieldValue' => '<html><body><p>'.htmlspecialchars($scriptText, ENT_QUOTES | ENT_HTML5, 'UTF-8').'</p><p>VOX</p></body></html>'],
            ]],
            'mos_objects' => [$object],
        ]);
    }

    private function graphic(string $commandId, string $itemId, string $objectId, string $slug, string $value): array
    {
        return [
            'commandId' => $commandId, 'itemId' => $itemId, 'objectId' => $objectId,
            'mosId' => 'TVRMCG', 'slug' => $slug, 'abstract' => 'Private MOS metadata',
            'editableObjects' => [['type' => 'TEXT', 'name' => $slug === '01_Titlu' ? 'Titlu' : 'NUME', 'value' => $value]],
        ];
    }
}
