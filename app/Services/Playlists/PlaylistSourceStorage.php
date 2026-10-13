<?php

namespace App\Services\Playlists;

use App\Models\Playlist;
use App\Services\Enps\EnpsBasicContent;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class PlaylistSourceStorage
{
    public const RETAINED_FILES = 10;

    private const DIRECTORY = 'playlist-sources';

    public function store(UploadedFile $file, string $contents): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        if (! in_array($extension, ['htm', 'html'], true)) {
            $extension = 'htm';
        }

        $path = self::DIRECTORY.'/'.now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;

        if (! Storage::disk('local')->put($path, $contents)) {
            throw new RuntimeException('Fișierul HTM nu a putut fi salvat.');
        }

        return $path;
    }

    public function exists(Playlist $playlist): bool
    {
        if ($playlist->source_type === 'enps') {
            return $playlist->source_enps_snapshot_path !== null
                && Storage::disk('local')->exists($playlist->source_enps_snapshot_path);
        }

        return $playlist->source_htm_path !== null
            && Storage::disk('local')->exists($playlist->source_htm_path);
    }

    public function contents(Playlist $playlist): string
    {
        if (! $this->exists($playlist)) {
            throw new RuntimeException('Fișierul HTM sursă nu mai este disponibil.');
        }

        return Storage::disk('local')->get($playlist->source_type === 'enps' ? $playlist->source_enps_snapshot_path : $playlist->source_htm_path);
    }

    public function storeEnpsSnapshot(array $payload): string
    {
        $scripts = array_map(function ($script) {
            $listData = array_intersect_key($script['RecordPointer']['ListData'] ?? [], array_flip(['Title', 'BeginText', 'Guid', 'Approved']));
            $listData['BeginText'] = is_string($listData['BeginText'] ?? null) ? $listData['BeginText'] : '';

            $snapshot = [
                'ScriptOrder' => $script['ScriptOrder'] ?? null,
                '_PlasmaHasContent' => EnpsPlaylistAdapter::scriptHasContent($script),
                '_PlasmaApproved' => EnpsPlaylistAdapter::scriptApproved($script),
                'RecordPointer' => ['ListData' => $listData],
            ];
            if (isset($script['BasicContent'], $script['_PlasmaSource'])) {
                $snapshot['BasicContent'] = EnpsBasicContent::forStorage($script['BasicContent']);
                $snapshot['_PlasmaSource'] = array_intersect_key($script['_PlasmaSource'], array_flip(['database', 'path', 'guid']));
            }

            return $snapshot;
        }, $payload['CollectionScripts']);
        $path = 'playlist-enps-sources/'.Str::uuid().'.json';
        if (! Storage::disk('local')->put($path, json_encode(['CollectionScripts' => $scripts], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR))) {
            throw new RuntimeException('Snapshotul ENPS nu a putut fi salvat.');
        }

        return $path;
    }

    public function delete(Playlist $playlist): void
    {
        if ($playlist->source_enps_snapshot_path !== null) {
            $this->deletePath($playlist->source_enps_snapshot_path);
        }
        if ($playlist->source_htm_path !== null) {
            $this->deletePath($playlist->source_htm_path);
        }
    }

    public function deletePath(string $path): void
    {
        Storage::disk('local')->delete($path);
    }

    public function prune(): void
    {
        $retainedPlaylistIds = Playlist::query()
            ->whereNotNull('source_htm_path')
            ->latest('id')
            ->limit(self::RETAINED_FILES)
            ->pluck('id');

        Playlist::query()
            ->whereNotNull('source_htm_path')
            ->whereNotIn('id', $retainedPlaylistIds)
            ->get()
            ->each(function (Playlist $playlist) {
                $this->delete($playlist);
                $playlist->update(['source_htm_path' => null]);
            });
    }
}
