<?php

namespace App\Services\Images;

use RuntimeException;

class ImageThumbnailService
{
    public const MAX_WIDTH = 640;

    public const QUALITY = 86;

    public function __construct(private readonly ImageStorage $storage) {}

    public function pathFor(string $originalPath): string
    {
        return '.thumbnails/'.ltrim(str_replace('\\', '/', $originalPath), '/').'.webp';
    }

    public function generate(string $originalPath): string
    {
        $disk = $this->storage->disk();
        $contents = $disk->get($originalPath);

        if (! is_string($contents) || $contents === '') {
            throw new RuntimeException("Imaginea originală [{$originalPath}] nu poate fi citită.");
        }

        return $this->generateFromContents($originalPath, $contents);
    }

    public function generateFromContents(string $originalPath, string $contents): string
    {
        $thumbnailPath = $this->pathFor($originalPath);
        $thumbnail = $this->encode($contents);

        if (! $this->storage->disk()->put($thumbnailPath, $thumbnail)) {
            throw new RuntimeException("Thumbnail-ul pentru [{$originalPath}] nu poate fi salvat.");
        }

        return $thumbnailPath;
    }

    public function ensure(string $originalPath): string
    {
        if (! $this->isValid($originalPath)) {
            return $this->generate($originalPath);
        }

        return $this->pathFor($originalPath);
    }

    public function isValid(string $originalPath): bool
    {
        $disk = $this->storage->disk();
        $thumbnailPath = $this->pathFor($originalPath);

        if (! $disk->exists($originalPath) || ! $disk->exists($thumbnailPath)) {
            return false;
        }

        $originalContents = $disk->get($originalPath);
        $thumbnailContents = $disk->get($thumbnailPath);
        $originalDimensions = is_string($originalContents) ? @getimagesizefromstring($originalContents) : false;
        $thumbnailDimensions = is_string($thumbnailContents) ? @getimagesizefromstring($thumbnailContents) : false;

        if ($originalDimensions === false || $thumbnailDimensions === false) {
            return false;
        }

        $expectedWidth = min(self::MAX_WIDTH, $originalDimensions[0]);
        $expectedHeight = max(1, (int) round($originalDimensions[1] * $expectedWidth / $originalDimensions[0]));

        return ($thumbnailDimensions['mime'] ?? null) === 'image/webp'
            && $thumbnailDimensions[0] === $expectedWidth
            && $thumbnailDimensions[1] === $expectedHeight;
    }

    public function delete(string $originalPath): void
    {
        $this->storage->disk()->delete($this->pathFor($originalPath));
    }

    private function encode(string $contents): string
    {
        $source = @imagecreatefromstring($contents);

        if ($source === false) {
            throw new RuntimeException('Conținutul nu este o imagine validă.');
        }

        try {
            $sourceWidth = imagesx($source);
            $sourceHeight = imagesy($source);
            $targetWidth = min(self::MAX_WIDTH, $sourceWidth);
            $targetHeight = max(1, (int) round($sourceHeight * $targetWidth / $sourceWidth));
            $thumbnail = imagecreatetruecolor($targetWidth, $targetHeight);

            if ($thumbnail === false) {
                throw new RuntimeException('Suprafața pentru thumbnail nu poate fi creată.');
            }

            try {
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
                $transparent = imagecolorallocatealpha($thumbnail, 0, 0, 0, 127);
                imagefilledrectangle($thumbnail, 0, 0, $targetWidth, $targetHeight, $transparent);
                imagecopyresampled(
                    $thumbnail,
                    $source,
                    0,
                    0,
                    0,
                    0,
                    $targetWidth,
                    $targetHeight,
                    $sourceWidth,
                    $sourceHeight,
                );

                ob_start();
                $encoded = imagewebp($thumbnail, null, self::QUALITY);
                $output = ob_get_clean();

                if (! $encoded || ! is_string($output) || $output === '') {
                    throw new RuntimeException('Thumbnail-ul WebP nu poate fi codificat.');
                }

                return $output;
            } finally {
                imagedestroy($thumbnail);
            }
        } finally {
            imagedestroy($source);
        }
    }

}
