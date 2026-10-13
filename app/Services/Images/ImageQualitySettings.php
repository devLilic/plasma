<?php

namespace App\Services\Images;

use App\Models\ApplicationSetting;

class ImageQualitySettings
{
    public const SETTING_KEY = 'image_minimum_dimensions';

    public const DEFAULT_WIDTH = 700;

    public const DEFAULT_HEIGHT = 400;

    /** @return array{width: int, height: int} */
    public function dimensions(): array
    {
        $storedValue = ApplicationSetting::query()
            ->where('key', self::SETTING_KEY)
            ->value('value');

        $decoded = is_string($storedValue) ? json_decode($storedValue, true) : null;

        return [
            'width' => is_array($decoded) && is_numeric($decoded['width'] ?? null)
                ? max(1, (int) $decoded['width'])
                : self::DEFAULT_WIDTH,
            'height' => is_array($decoded) && is_numeric($decoded['height'] ?? null)
                ? max(1, (int) $decoded['height'])
                : self::DEFAULT_HEIGHT,
        ];
    }

    /** @param array{width: int, height: int} $minimum @return array{width: int, height: int} Largest 16:9 crop fitting inside the configured minimum dimensions. */
    public function cropDimensions(array $minimum): array
    {
        $width = min($minimum['width'], (int) floor($minimum['height'] * 16 / 9));

        return ['width' => $width, 'height' => (int) floor($width * 9 / 16)];
    }

    /** @return array{width: int, height: int} */
    public function save(int $width, int $height): array
    {
        $dimensions = ['width' => $width, 'height' => $height];

        ApplicationSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($dimensions, JSON_THROW_ON_ERROR)],
        );

        return $dimensions;
    }
}
