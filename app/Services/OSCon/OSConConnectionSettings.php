<?php

namespace App\Services\OSCon;

use App\Models\ApplicationSetting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class OSConConnectionSettings
{
    public const KEY = 'oscon.connection';
    public const DEFAULT_ENDPOINT = 'http://127.0.0.1:47834';

    private function stored(): array
    {
        $value = ApplicationSetting::query()->where('key', self::KEY)->value('value');
        if ($value === null) return ['endpoint' => self::DEFAULT_ENDPOINT, 'encryptedToken' => null];
        try {
            $settings = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($settings) || ! is_string($settings['endpoint'] ?? null)
                || ! $this->validEndpoint($settings['endpoint'])
                || (isset($settings['encryptedToken']) && ! is_string($settings['encryptedToken']))) {
                throw new \RuntimeException;
            }
            return $settings;
        } catch (Throwable) {
            throw ValidationException::withMessages(['connection' => 'Configurarea OSCon este invalidă. Salvează din nou adresa și tokenul.']);
        }
    }

    public function publicSettings(): array
    {
        try {
            $settings = $this->stored();
            if ($settings['encryptedToken'] ?? null) Crypt::decryptString($settings['encryptedToken']);
            return ['endpoint' => $settings['endpoint'], 'hasToken' => ! empty($settings['encryptedToken']), 'error' => null];
        } catch (Throwable) {
            return ['endpoint' => self::DEFAULT_ENDPOINT, 'hasToken' => false, 'error' => 'Configurarea OSCon trebuie reparată prin salvarea adresei și a unui token nou.'];
        }
    }

    public function connection(): array
    {
        $settings = $this->stored();
        if (empty($settings['encryptedToken'])) {
            throw ValidationException::withMessages(['connection' => 'Configurează tokenul OSCon în Setări.']);
        }
        try { $token = Crypt::decryptString($settings['encryptedToken']); }
        catch (Throwable) { throw ValidationException::withMessages(['connection' => 'Tokenul OSCon nu poate fi citit. Salvează un token nou în Setări.']); }
        return ['endpoint' => $settings['endpoint'], 'token' => $token, 'timeoutMs' => 10000];
    }

    public function save(string $endpoint, ?string $token, bool $clearToken = false): void
    {
        $endpoint = rtrim(trim($endpoint), '/');
        if (! $this->validEndpoint($endpoint)) {
            throw ValidationException::withMessages(['endpoint' => 'Folosește o adresă HTTP/HTTPS cu host și port, fără credențiale, cale sau query.']);
        }
        DB::transaction(function () use ($endpoint, $token, $clearToken) {
            ApplicationSetting::query()->where('key', self::KEY)->lockForUpdate()->first();
            if ($clearToken) $encrypted = null;
            elseif ($token !== null && $token !== '') $encrypted = Crypt::encryptString($token);
            else {
                $stored = $this->stored();
                $encrypted = $stored['encryptedToken'] ?? null;
                if ($encrypted) {
                    try { Crypt::decryptString($encrypted); }
                    catch (Throwable) { throw ValidationException::withMessages(['token' => 'Introdu un token nou pentru repararea configurării.']); }
                }
            }
            ApplicationSetting::query()->updateOrCreate(['key' => self::KEY], [
                'value' => json_encode(['endpoint' => $endpoint, 'encryptedToken' => $encrypted], JSON_THROW_ON_ERROR),
            ]);
        });
    }

    private function validEndpoint(string $endpoint): bool
    {
        $parts = parse_url($endpoint);
        return is_array($parts) && in_array($parts['scheme'] ?? '', ['http', 'https'], true)
            && ! empty($parts['host']) && ! preg_match('/[\s\\\\]/', $parts['host'])
            && ! isset($parts['user'], $parts['pass']) && ! isset($parts['user']) && ! isset($parts['pass'])
            && ! isset($parts['query']) && ! isset($parts['fragment']) && empty($parts['path'])
            && (! isset($parts['port']) || ($parts['port'] >= 1 && $parts['port'] <= 65535));
    }
}
