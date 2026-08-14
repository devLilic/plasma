<?php

namespace App\Services\Playlists;

use App\Models\Playlist;
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
        return $playlist->source_htm_path !== null
            && Storage::disk('local')->exists($playlist->source_htm_path);
    }

    public function contents(Playlist $playlist): string
    {
        if (! $this->exists($playlist)) {
            throw new RuntimeException('Fișierul HTM sursă nu mai este disponibil.');
        }

        return Storage::disk('local')->get($playlist->source_htm_path);
    }

    public function delete(Playlist $playlist): void
    {
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
