<?php

namespace App\Services\LBPortal;

use App\Models\ApplicationSetting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class LBPortalConnectionSettings
{
    public const KEY = 'lb-portal.connection';
    public const DEFAULT_HOST = '127.0.0.1';
    public const DEFAULT_PORT = 47835;

    private function stored(): array
    {
        $value = ApplicationSetting::query()->where('key', self::KEY)->value('value');
        if ($value === null) return ['host' => self::DEFAULT_HOST, 'port' => self::DEFAULT_PORT, 'encryptedAccessKey' => null];
        try {
            $settings = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($settings) || ! is_string($settings['host'] ?? null) || ! filter_var($settings['host'], FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
                || ! is_int($settings['port'] ?? null) || $settings['port'] < 1 || $settings['port'] > 65535
                || (isset($settings['encryptedAccessKey']) && ! is_string($settings['encryptedAccessKey']))) {
                throw new \RuntimeException;
            }
            return $settings;
        } catch (Throwable) {
            throw ValidationException::withMessages(['connection' => 'Configurarea LB-Portal este invalidă. Salvează din nou IP-ul, portul și cheia de acces.']);
        }
    }

    public function publicSettings(): array
    {
        try {
            $settings = $this->stored();
            if ($settings['encryptedAccessKey'] ?? null) Crypt::decryptString($settings['encryptedAccessKey']);
            return ['host' => $settings['host'], 'port' => $settings['port'], 'hasAccessKey' => ! empty($settings['encryptedAccessKey']), 'error' => null];
        } catch (Throwable) {
            return ['host' => self::DEFAULT_HOST, 'port' => self::DEFAULT_PORT, 'hasAccessKey' => false, 'error' => 'Configurarea LB-Portal trebuie reparată prin salvarea unui IP, port și a unei chei noi.'];
        }
    }

    public function connection(): array
    {
        $settings = $this->stored();
        if (empty($settings['encryptedAccessKey'])) {
            throw ValidationException::withMessages(['connection' => 'Configurează cheia de acces LB-Portal în Setări.']);
        }
        try { $accessKey = Crypt::decryptString($settings['encryptedAccessKey']); }
        catch (Throwable) { throw ValidationException::withMessages(['connection' => 'Cheia LB-Portal nu poate fi citită. Salvează o cheie nouă în Setări.']); }
        return ['endpoint' => "http://{$settings['host']}:{$settings['port']}", 'accessKey' => $accessKey, 'timeoutMs' => 5000];
    }

    public function save(string $host, int $port, ?string $accessKey, bool $clearAccessKey = false): void
    {
        $host = trim($host);
        if (! filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            throw ValidationException::withMessages(['host' => 'Introdu o adresă IPv4 validă pentru LB-Portal.']);
        }
        if ($port < 1 || $port > 65535) throw ValidationException::withMessages(['port' => 'Portul trebuie să fie între 1 și 65535.']);
        if ($accessKey !== null && $accessKey !== '' && (strlen($accessKey) < 32 || strlen($accessKey) > 512 || preg_match('/\s/', $accessKey))) {
            throw ValidationException::withMessages(['accessKey' => 'Cheia trebuie să aibă între 32 și 512 caractere și să nu conțină spații.']);
        }

        DB::transaction(function () use ($host, $port, $accessKey, $clearAccessKey) {
            ApplicationSetting::query()->where('key', self::KEY)->lockForUpdate()->first();
            if ($clearAccessKey) $encrypted = null;
            elseif ($accessKey !== null && $accessKey !== '') $encrypted = Crypt::encryptString($accessKey);
            else {
                $stored = $this->stored();
                $encrypted = $stored['encryptedAccessKey'] ?? null;
                if ($encrypted) {
                    try { Crypt::decryptString($encrypted); }
                    catch (Throwable) { throw ValidationException::withMessages(['accessKey' => 'Introdu o cheie nouă pentru repararea configurării.']); }
                }
            }
            ApplicationSetting::query()->updateOrCreate(['key' => self::KEY], [
                'value' => json_encode(['host' => $host, 'port' => $port, 'encryptedAccessKey' => $encrypted], JSON_THROW_ON_ERROR),
            ]);
        });
    }
}
