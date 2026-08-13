<?php

namespace App\Services\Images;

use App\Models\ApplicationSetting;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class ImageStorage
{
    public const SETTING_KEY = 'image_storage_path';

    public function root(): string
    {
        return ApplicationSetting::query()
            ->where('key', self::SETTING_KEY)
            ->value('value') ?: config('filesystems.disks.images.root');
    }

    public function disk(): FilesystemAdapter
    {
        $defaultRoot = config('filesystems.disks.images.root');
        $root = $this->root();

        if ($root === $defaultRoot) {
            return Storage::disk('images');
        }

        return Storage::build([
            ...config('filesystems.disks.images'),
            'root' => $root,
        ]);
    }
}
