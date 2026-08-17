<?php

namespace App\Services\Playlists;

use App\Models\ApplicationSetting;

class PlaylistTitleExclusions
{
    public const SETTING_KEY = 'playlist_title_exclusions';

    public const DEFAULT_TERMS = [
        'GENERIC  IN',
        'GENERIC IN',
        'DUPLEX',
        'PA-INTRO',
        'GENERIC OUT',
        'EXTRO',
    ];

    /** @return array<int, string> */
    public function terms(): array
    {
        $storedValue = ApplicationSetting::query()
            ->where('key', self::SETTING_KEY)
            ->value('value');

        if ($storedValue === null) {
            return self::DEFAULT_TERMS;
        }

        $decoded = json_decode($storedValue, true);

        return is_array($decoded) ? $this->normalize($decoded) : self::DEFAULT_TERMS;
    }

    /** @param  array<int, mixed>  $terms */
    public function save(array $terms): array
    {
        $normalized = $this->normalize($terms);

        ApplicationSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($normalized, JSON_UNESCAPED_UNICODE)],
        );

        return $normalized;
    }

    /**
     * @param  array<int, mixed>  $terms
     * @return array<int, string>
     */
    private function normalize(array $terms): array
    {
        return collect($terms)
            ->filter(fn ($term) => is_string($term))
            ->map(fn (string $term) => mb_strtoupper(trim($term)))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
