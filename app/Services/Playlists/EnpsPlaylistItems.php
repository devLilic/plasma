<?php

namespace App\Services\Playlists;

use App\Models\Playlist;
use App\Services\Enps\EnpsBasicContent;

class EnpsPlaylistItems
{
    /** Called inside the same transaction as article and snapshot synchronization. */
    public function synchronize(Playlist $playlist, array $payload): void
    {
        $scripts = $payload['CollectionScripts'];
        usort($scripts, fn ($a, $b) => (int) ($a['ScriptOrder'] ?? 0) <=> (int) ($b['ScriptOrder'] ?? 0));
        $playlist->enpsItems()->delete();
        foreach ($scripts as $position => $script) {
            if (! isset($script['BasicContent'], $script['_PlasmaSource'])) {
                continue;
            }
            $source = $script['_PlasmaSource'];
            $content = EnpsBasicContent::forStorage($script['BasicContent']);
            $playlist->enpsItems()->create([
                'position' => $position + 1,
                'script_order' => $script['ScriptOrder'] ?? null,
                'source_database' => $source['database'],
                'source_path' => $source['path'],
                'source_guid' => $source['guid'],
                'slug' => $script['RecordPointer']['ListData']['Title'] ?? $content['ListData']['Title'] ?? null,
                'basic_content' => $content,
                'mos_objects' => EnpsBasicContent::mosObjects($content),
            ]);
        }
    }
}
