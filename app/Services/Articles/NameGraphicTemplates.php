<?php

namespace App\Services\Articles;

use App\Models\ApplicationSetting;

class NameGraphicTemplates
{
    public const SETTING_KEY = 'mos_name_graphic_templates';
    public const DEFAULT_TEMPLATES = ['02_Nume'];

    /** @return array<int, string> */
    public function templates(): array
    {
        $value = ApplicationSetting::query()->where('key', self::SETTING_KEY)->value('value');
        if ($value === null) return self::DEFAULT_TEMPLATES;

        $templates = json_decode($value, true);
        return is_array($templates) ? $this->normalize($templates) : self::DEFAULT_TEMPLATES;
    }

    /** @param array<int, mixed> $templates
     *  @return array<int, string>
     */
    public function save(array $templates): array
    {
        $normalized = $this->normalize($templates);
        ApplicationSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)],
        );
        return $normalized;
    }

    /** @param array<int, mixed> $templates
     *  @return array<int, string>
     */
    private function normalize(array $templates): array
    {
        return collect($templates)->filter(fn ($value) => is_string($value))
            ->map(fn (string $value) => trim($value))->filter()
            ->unique(fn ($value) => mb_strtolower($value))->values()->all();
    }
}
