<?php

namespace App\Services\Images;

use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class ExternalImageService
{
    private const MAX_BYTES = 12 * 1024 * 1024;

    private const MAX_REDIRECTS = 3;

    private const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

    public function crop(string $url, array $section): string
    {
        $contents = $this->download($url);
        $source = @imagecreatefromstring($contents);

        if ($source === false) {
            throw ValidationException::withMessages(['data.url' => 'Linkul nu conține o imagine validă.']);
        }

        try {
            $sourceWidth = imagesx($source);
            $sourceHeight = imagesy($source);
            $crop = [
                'x' => max(0, (int) round($sourceWidth * $section['x'] / 100)),
                'y' => max(0, (int) round($sourceHeight * $section['y'] / 100)),
                'width' => (int) round($sourceWidth * $section['width'] / 100),
                'height' => (int) round($sourceHeight * $section['height'] / 100),
            ];
            $crop['width'] = min($crop['width'], $sourceWidth - $crop['x']);
            $crop['height'] = min($crop['height'], $sourceHeight - $crop['y']);

            if ($crop['width'] < 1 || $crop['height'] < 1) {
                throw ValidationException::withMessages(['data.section' => 'Zona de decupare nu este validă.']);
            }

            $cropped = imagecrop($source, $crop);
            if ($cropped === false) {
                throw ValidationException::withMessages(['data.section' => 'Imaginea nu a putut fi decupată.']);
            }

            try {
                ob_start();
                imagejpeg($cropped, null, 92);

                return (string) ob_get_clean();
            } finally {
                imagedestroy($cropped);
            }
        } finally {
            imagedestroy($source);
        }
    }

    private function download(string $url): string
    {
        $currentUrl = $url;

        for ($redirect = 0; $redirect <= self::MAX_REDIRECTS; $redirect++) {
            $this->assertPublicUrl($currentUrl);
            $response = Http::connectTimeout(5)
                ->timeout(12)
                ->withHeaders($this->downloadHeaders($currentUrl))
                ->withOptions(['allow_redirects' => false, 'stream' => true])
                ->get($currentUrl);

            if ($response->redirect()) {
                $location = $response->header('Location');
                if (! $location || $redirect === self::MAX_REDIRECTS) {
                    throw ValidationException::withMessages(['data.url' => 'Imaginea are prea multe redirecționări.']);
                }

                $currentUrl = (string) UriResolver::resolve(new Uri($currentUrl), new Uri($location));

                continue;
            }

            if (! $response->successful()) {
                throw ValidationException::withMessages(['data.url' => 'Imaginea externă nu poate fi descărcată.']);
            }

            $contentType = strtolower((string) $response->header('Content-Type'));
            if (! str_starts_with($contentType, 'image/')) {
                throw ValidationException::withMessages(['data.url' => 'Linkul trebuie să indice direct către o imagine.']);
            }

            $stream = $response->toPsrResponse()->getBody();
            $contents = '';
            while (! $stream->eof()) {
                $contents .= $stream->read(8192);
                if (strlen($contents) > self::MAX_BYTES) {
                    throw ValidationException::withMessages(['data.url' => 'Imaginea externă depășește limita de 12 MB.']);
                }
            }

            return $contents;
        }

        throw ValidationException::withMessages(['data.url' => 'Imaginea externă nu poate fi descărcată.']);
    }

    /** @return array<string, string> */
    private function downloadHeaders(string $url): array
    {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? 'https'));
        $host = (string) ($parts['host'] ?? '');
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return [
            'User-Agent' => self::BROWSER_USER_AGENT,
            'Accept' => 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer' => $scheme.'://'.$host.$port.'/',
        ];
    }

    private function assertPublicUrl(string $url): void
    {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = $parts['host'] ?? null;

        if (! $host || ! in_array($scheme, ['http', 'https'], true) || isset($parts['user']) || isset($parts['pass'])) {
            throw ValidationException::withMessages(['data.url' => 'Folosește un link public HTTP sau HTTPS.']);
        }

        $addresses = [];
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $addresses[] = $host;
        } else {
            foreach (dns_get_record($host, DNS_A | DNS_AAAA) ?: [] as $record) {
                if (isset($record['ip'])) {
                    $addresses[] = $record['ip'];
                }
                if (isset($record['ipv6'])) {
                    $addresses[] = $record['ipv6'];
                }
            }
        }

        if ($addresses === []) {
            throw ValidationException::withMessages(['data.url' => 'Domeniul imaginii nu poate fi rezolvat.']);
        }

        foreach ($addresses as $address) {
            if (filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                throw ValidationException::withMessages(['data.url' => 'Adresele locale sau private nu sunt permise.']);
            }
        }
    }
}
