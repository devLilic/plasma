<?php

namespace Tests\Unit;

use App\Services\Images\ExternalImageService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExternalImageServiceTest extends TestCase
{
    public function test_download_uses_browser_headers_and_a_same_origin_referer(): void
    {
        $source = imagecreatetruecolor(160, 90);
        imagefill($source, 0, 0, imagecolorallocate($source, 30, 90, 170));
        ob_start();
        imagejpeg($source, null, 90);
        $jpeg = (string) ob_get_clean();
        imagedestroy($source);

        Http::fake([
            'https://8.8.8.8/*' => Http::response($jpeg, 200, ['Content-Type' => 'image/jpeg']),
        ]);

        $result = app(ExternalImageService::class)->crop(
            'https://8.8.8.8/path/photo.jpg?size=large',
            ['x' => 0, 'y' => 0, 'width' => 100, 'height' => 100],
        );

        $this->assertNotSame('', $result);
        $cropped = imagecreatefromstring($result);
        $this->assertNotFalse($cropped);
        imagedestroy($cropped);
        Http::assertSent(fn (Request $request) =>
            str_starts_with($request->header('User-Agent')[0] ?? '', 'Mozilla/5.0')
            && str_contains($request->header('Accept')[0] ?? '', 'image/*')
            && ($request->header('Referer')[0] ?? null) === 'https://8.8.8.8/'
        );
    }
}
