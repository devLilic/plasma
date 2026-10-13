<?php

namespace App\Services\Enps;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class EnpsWebSession
{
    public function clientFromSession(Request $request): EnpsWebClient
    {
        $cookies = $this->decryptSessionValue($request, 'cookies', []);
        $address = $request->session()->get('enps_web.state.serviceAddress');

        return new EnpsWebClient($cookies, is_string($address) ? $address : null);
    }

    public function storeSession(Request $request, array $connection): void
    {
        $request->session()->put('enps_web.state', [
            'user' => $connection['user'] ?? null,
            'homeDatabase' => $connection['homeDatabase'],
            'homeProgram' => $connection['homeProgram'],
            'globalTables' => $connection['globalTables'],
            'playlists' => $connection['playlists'],
            'serviceAddress' => $connection['serviceAddress'],
            'verifiedAt' => $connection['verifiedAt'],
        ]);
        $request->session()->put('enps_web.tokens', Crypt::encryptString(json_encode($connection['tokens'], JSON_THROW_ON_ERROR)));
        $request->session()->put('enps_web.cookies', Crypt::encryptString(json_encode($connection['cookies'], JSON_THROW_ON_ERROR)));
        $request->session()->put('enps_web.service_address', Crypt::encryptString($connection['serviceAddress']));
    }

    public function connectionFromSession(Request $request): ?array
    {
        $state = $request->session()->get('enps_web.state');
        if (! is_array($state) || ! $request->session()->has('enps_web.tokens')) {
            return null;
        }

        return [
            ...$state,
            'tokens' => $this->decryptSessionValue($request, 'tokens', []),
            'cookies' => $this->decryptSessionValue($request, 'cookies', []),
        ];
    }

    public function decryptSessionValue(Request $request, string $key, mixed $fallback = null): mixed
    {
        try {
            $encrypted = $request->session()->get('enps_web.'.$key);
            if (! is_string($encrypted)) {
                return $fallback;
            }
            $value = json_decode(Crypt::decryptString($encrypted), true, 512, JSON_THROW_ON_ERROR);

            return $value ?? $fallback;
        } catch (Throwable) {
            return $fallback;
        }
    }

    public function clearSession(Request $request): void
    {
        $request->session()->forget('enps_web');
    }
}
