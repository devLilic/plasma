<?php

namespace App\Console\Commands;

use App\Models\Image;
use App\Services\Images\ImageStorage;
use App\Services\Images\ImageThumbnailService;
use Illuminate\Console\Command;
use Throwable;

class GenerateImageThumbnails extends Command
{
    protected $signature = 'images:generate-thumbnails {--force : Regenerează și thumbnail-urile valide existente}';

    protected $description = 'Generează thumbnail-uri WebP pentru biblioteca media';

    public function handle(ImageStorage $storage, ImageThumbnailService $thumbnails): int
    {
        $generated = 0;
        $skipped = 0;
        $failed = 0;

        foreach (Image::query()->orderBy('id')->cursor() as $image) {
            if (! $storage->disk()->exists($image->url)) {
                $this->warn("Lipsește originalul: {$image->url}");
                $failed++;

                continue;
            }

            if (! $this->option('force') && $thumbnails->isValid($image->url)) {
                $skipped++;

                continue;
            }

            try {
                $thumbnails->generate($image->url);
                $generated++;
            } catch (Throwable $exception) {
                $this->error("{$image->url}: {$exception->getMessage()}");
                $failed++;
            }
        }

        $this->info("Generate: {$generated}; existente: {$skipped}; eșuate: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
