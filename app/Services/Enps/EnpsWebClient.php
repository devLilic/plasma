<?php

namespace App\Services\Enps;

use Carbon\CarbonImmutable;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use JsonException;
use Throwable;

class EnpsWebClient
{
    private CookieJar $cookies;

    private ?string $serviceAddress;

    public function __construct(?array $cookies = null, ?string $serviceAddress = null)
    {
        $this->cookies = new CookieJar(false, $cookies ?? []);
        $this->serviceAddress = $serviceAddress;
    }

    public function connect(): array
    {
        $this->assertConfigured();
        $landingPage = $this->send('GET', (string) config('services.enps.url'));
        $this->serviceAddress = $this->serviceAddressFromLandingPage($landingPage->body());
        $health = $this->send('GET', $this->endpoint('/api/IsAlive'));
        if (($this->json($health, 'Serviciul ENPS a returnat un răspuns invalid.')['status'] ?? false) !== true) {
            throw new EnpsWebException('unavailable', 'Serviciul ENPS Web nu este activ.', 503);
        }
        [$username, $domain] = $this->loginIdentity((string) config('services.enps.username'), (string) config('services.enps.domain'));
        $dayOfYear = CarbonImmutable::now((string) config('services.enps.timezone', 'Europe/Chisinau'))->dayOfYear;
        $response = $this->send('POST', $this->endpoint('/api/Logon'), [
            'staffUserId' => $username,
            'domainUserId' => $username,
            'password' => (string) config('services.enps.password'),
            'domainName' => $domain,
            'devKey' => self::deviceKeyForDay($dayOfYear),
            'iClientType' => 9,
            'deviceToken' => '',
        ], ignoreSessionTokens: true);

        $hello = $this->json($response, 'Autentificarea ENPS a returnat un răspuns invalid.');
        $nomToken = $response->header('X-ENPS-TOKEN');
        $authorization = $response->header('Authorization');
        if (! is_string($nomToken) || trim($nomToken) === '') {
            throw new EnpsWebException('invalid_response', 'ENPS nu a returnat tokenul sesiunii.');
        }

        $tokens = ['nom' => $nomToken, 'authorization' => is_string($authorization) ? $authorization : ''];
        $this->ping($tokens);
        $globalTablesResponse = $this->sendAuthed('GET', $this->endpoint('/api/GlobalTables').'?'.http_build_query([
            'filterLangPrefix' => 'MobileV3',
            'filterInActiveUsers' => 'True',
        ]), $tokens);
        $globalTables = $this->json($globalTablesResponse, 'ENPS a returnat tabele globale într-un format invalid.');
        $homeDatabase = $this->safeString($hello['HomeDatabase'] ?? null);
        $homeProgram = $this->safeString($hello['HomeProgram'] ?? null);
        if ($homeDatabase === null || $homeProgram === null) {
            throw new EnpsWebException('invalid_response', 'Răspunsul de logare ENPS nu conține baza și programul utilizatorului.');
        }

        $playlists = $this->refreshPlaylists($tokens, $homeDatabase, $homeProgram);

        return [
            'tokens' => $tokens,
            'cookies' => $this->cookies(),
            'serviceAddress' => $this->serviceAddress,
            'user' => $this->safeString($hello['UserID'] ?? null),
            'homeDatabase' => $homeDatabase,
            'homeProgram' => $homeProgram,
            'globalTables' => $this->summarizeGlobalTables($globalTables),
            'playlists' => $playlists,
            'verifiedAt' => now()->toIso8601String(),
        ];
    }

    public function ping(array &$tokens): void
    {
        $this->sendAuthed('GET', $this->endpoint('/api/Ping'), $tokens);
    }

    public function refreshPlaylists(array &$tokens, string $database, string $homeProgram): array
    {
        $listsResponse = $this->sendAuthed('POST', $this->endpoint('/api/Lists'), $tokens, [
            'Database' => $database,
            'ENPSListParameters' => [$this->listParameters('P_'.$homeProgram.'\\W', 0, -1)],
        ]);
        $lists = $this->json($listsResponse, 'ENPS a returnat listele într-un format invalid.');

        return $this->playlistsFromLists($lists);
    }

    public function rundownContent(array &$tokens, string $database, array $playlist): array
    {
        $uri = $playlist['uri'] ?? $playlist['path'];
        $query = http_build_query([
            'uri' => $uri,
            'database' => $database,
            'path' => $playlist['path'],
            'guid' => $playlist['guid'],
            'hitHighlightTerm' => '',
            'returnText' => 'true',
        ]);
        $response = $this->sendAuthed('GET', $this->endpoint('/api/RundownContent').'?'.$query, $tokens);
        $payload = $this->json($response, 'ENPS a returnat conținutul playlistului într-un format invalid.');

        return $payload;
    }

    /** Fetch every addressable record before any local playlist data is changed. */
    public function rundownWithBasicContent(array &$tokens, string $database, array $playlist): array
    {
        $payload = $this->rundownContent($tokens, $database, $playlist);
        if (! is_array($payload['CollectionScripts'] ?? null)) {
            throw new EnpsWebException('invalid_response', 'Răspunsul ENPS nu conține CollectionScripts.', 422);
        }
        $contents = [];
        foreach ($payload['CollectionScripts'] as &$script) {
            if (! is_array($script)) {
                throw new EnpsWebException('invalid_response', 'ENPS a returnat un script invalid.', 422);
            }
            $pointer = $script['RecordPointer'] ?? [];
            $fields = $this->fieldsFromRecord(is_array($pointer) ? $pointer : []);
            $title = $this->firstText($fields, ['title']);
            if (($title !== null && preg_match('/-(?:INTRO|INTO)\s*$/iu', $title))
                || in_array('INTRO', $this->segmentsFromFields($this->fieldsFromRecord($script)), true)) {
                continue;
            }
            $guid = $this->firstText($fields, ['guid']);
            if ($guid === null || in_array(trim($guid, '{}'), ['0', '00000000-0000-0000-0000-000000000000'], true)) {
                if ($this->firstText($fields, ['title']) === null) {
                    continue; // Structural rows without a record have no BasicContent.
                }
                throw new EnpsWebException('invalid_response', 'Un element ENPS nu conține GUID pentru BasicContent.', 422);
            }
            $source = [
                'database' => $this->firstText($fields, ['enpsdatabase', 'database']) ?? $database,
                'path' => $this->firstText($fields, ['path']) ?? $playlist['path'],
                'guid' => $guid,
            ];
            $key = json_encode($source, JSON_THROW_ON_ERROR);
            if (! array_key_exists($key, $contents)) {
                $response = $this->sendAuthed('GET', $this->endpoint('/api/BasicContent').'?'.http_build_query([
                    ...$source,
                    'hitHighlightTerm' => '',
                ]), $tokens);
                $content = $this->json($response, 'ENPS a returnat BasicContent într-un format invalid.');
                if (! is_array($content['ListData'] ?? null)
                    || ! is_array($content['ObjectProperties'] ?? null)
                    || strcasecmp((string) ($content['ListData']['Guid'] ?? ''), $guid) !== 0) {
                    throw new EnpsWebException('invalid_response', 'BasicContent ENPS nu corespunde elementului solicitat.', 422);
                }
                $contents[$key] = EnpsBasicContent::forStorage($content);
            }
            $script['_PlasmaSource'] = $source;
            $script['BasicContent'] = $contents[$key];
        }
        unset($script);

        return $payload;
    }

    /** Refresh one already identified ENPS record without rereading its rundown. */
    public function basicContent(array &$tokens, string $database, string $path, string $guid): array
    {
        $response = $this->sendAuthed('GET', $this->endpoint('/api/BasicContent').'?'.http_build_query([
            'database' => $database,
            'path' => $path,
            'guid' => $guid,
            'hitHighlightTerm' => '',
        ]), $tokens);
        $content = $this->json($response, 'ENPS a returnat BasicContent într-un format invalid.');
        if (! is_array($content['ListData'] ?? null)
            || ! is_array($content['ObjectProperties'] ?? null)
            || strcasecmp((string) ($content['ListData']['Guid'] ?? ''), $guid) !== 0) {
            throw new EnpsWebException('invalid_response', 'BasicContent ENPS nu corespunde elementului solicitat.', 422);
        }

        return EnpsBasicContent::forStorage($content);
    }

    public function cookies(): array
    {
        return $this->cookies->toArray();
    }

    private function sendAuthed(string $method, string $url, array &$tokens, ?array $payload = null): Response
    {
        $response = $this->send($method, $url, $payload, $tokens);
        $nom = $response->header('X-ENPS-TOKEN');
        $authorization = $response->header('Authorization');
        if (is_string($nom) && $nom !== '') {
            $tokens['nom'] = $nom;
        }
        if (is_string($authorization) && $authorization !== '') {
            $tokens['authorization'] = $authorization;
        }

        return $response;
    }

    private function send(
        string $method,
        string $url,
        ?array $payload = null,
        ?array $tokens = null,
        bool $ignoreSessionTokens = false,
    ): Response {
        $request = $this->http()->withOptions(['cookies' => $this->cookies]);
        if (! $ignoreSessionTokens && $tokens !== null) {
            $headers = ['X-ENPS-TOKEN' => $tokens['nom']];
            if ($tokens['authorization'] !== '') {
                $headers['Authorization'] = $tokens['authorization'];
            }
            $request->withHeaders($headers);
        }

        try {
            $response = $method === 'POST' ? $request->post($url, $payload ?? []) : $request->get($url);
        } catch (ConnectionException $exception) {
            $timedOut = str_contains(strtolower($exception->getMessage()), 'timed out');
            throw new EnpsWebException(
                $timedOut ? 'timeout' : 'unavailable',
                $timedOut ? 'ENPS Web nu a răspuns în intervalul configurat.' : 'Serviciul ENPS Web nu este disponibil.',
                503,
            );
        } catch (Throwable) {
            throw new EnpsWebException('unavailable', 'Serviciul ENPS Web nu este disponibil.', 503);
        }

        if (! $response->successful()) {
            if (in_array($response->status(), [401, 403], true)) {
                $hasSession = $tokens !== null;
                throw new EnpsWebException(
                    $hasSession ? 'expired' : 'credentials',
                    $hasSession ? 'Sesiunea ENPS a expirat. Reconectează-te.' : 'Autentificarea ENPS a fost refuzată. Verifică utilizatorul, parola și domeniul.',
                    $hasSession ? 401 : 422,
                );
            }
            throw new EnpsWebException('unavailable', 'Serviciul ENPS Web a refuzat solicitarea.', 503);
        }

        return $response;
    }

    private function http(): PendingRequest
    {
        return Http::acceptJson()
            ->connectTimeout(min(5, (int) config('services.enps.timeout', 20)))
            ->timeout(max(1, (int) config('services.enps.timeout', 20)));
    }

    private function assertConfigured(): void
    {
        if (blank(config('services.enps.url')) || blank(config('services.enps.username')) || blank(config('services.enps.password'))) {
            throw new EnpsWebException('configuration', 'Completează ENPS_WEB_USERNAME și ENPS_WEB_PASSWORD în fișierul .env.', 422);
        }
    }

    private function serviceAddressFromLandingPage(string $html): string
    {
        if (! preg_match('/var\s+serverConfig\s*=\s*(\{.*?\})\s*;/s', $html, $matches)) {
            throw new EnpsWebException('invalid_response', 'Pagina ENPS Web nu conține configurația serviciului.');
        }
        try {
            $configuration = json_decode($matches[1], true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new EnpsWebException('invalid_response', 'Configurația serviciului ENPS are un format invalid.');
        }

        $address = $configuration['serviceAddress'] ?? null;
        $parts = is_string($address) ? parse_url($address) : false;
        if (! is_array($parts) || ! in_array($parts['scheme'] ?? '', ['http', 'https'], true) || empty($parts['host'])) {
            throw new EnpsWebException('invalid_response', 'Adresa serviciului JSON ENPS este invalidă.');
        }

        return rtrim($address, '/');
    }

    private function endpoint(string $path): string
    {
        if ($this->serviceAddress === null) {
            throw new EnpsWebException('invalid_response', 'Adresa serviciului ENPS nu a fost inițializată.');
        }

        return $this->serviceAddress.$path;
    }

    private function loginIdentity(string $username, string $domain): array
    {
        $username = trim($username);
        if (str_contains($username, '\\')) {
            [$domain, $username] = explode('\\', $username, 2);
        } elseif (str_contains($username, '@')) {
            [$username, $domain] = explode('@', $username, 2);
        }
        $username = preg_replace('/[\s._]/u', '-', mb_strtoupper($username, 'UTF-8')) ?? '';
        if ($username === '') {
            throw new EnpsWebException('configuration', 'Numele de utilizator ENPS este invalid.', 422);
        }

        return [$username, trim($domain)];
    }

    public static function deviceKeyForDay(int $dayOfYear): string
    {
        $secret = '@pM0B1L3Z1pD!sk2k7L3tMe!n6';
        $key = substr(sha1(iconv('UTF-8', 'UTF-16LE', $secret), true)."\0\0\0\0", 0, 24);
        $iv = substr(sha1('', true), 0, 8);
        $plainText = iconv('UTF-8', 'UTF-16LE', '@pM0B1L3!5TheB35t|'.$dayOfYear);
        $encrypted = openssl_encrypt($plainText, 'des-ede3-cbc', $key, OPENSSL_RAW_DATA, $iv);
        if (! is_string($encrypted)) {
            throw new EnpsWebException('invalid_response', 'Nu s-a putut genera cheia zilnică ENPS.');
        }

        return base64_encode($encrypted);
    }

    private function json(Response $response, string $message): array
    {
        try {
            $data = $response->json();
        } catch (Throwable) {
            throw new EnpsWebException('invalid_response', $message);
        }
        if (! is_array($data)) {
            throw new EnpsWebException('invalid_response', $message);
        }

        return $data;
    }

    private function summarizeGlobalTables(array $tables): array
    {
        $summary = [];
        foreach ($tables as $name => $value) {
            if (is_array($value)) {
                $summary[(string) $name] = count($value);
            } elseif (is_string($value) || is_numeric($value) || is_bool($value)) {
                $summary[(string) $name] = 1;
            }
        }

        return array_slice($summary, 0, 30, true);
    }

    private function listParameters(string $path, int $type, ?int $priority): array
    {
        $nullDate = CarbonImmutable::create(1800, 3, 1, 0, 0, 0, (string) config('services.enps.timezone', 'Europe/Chisinau'))
            ->utc()
            ->format('Y-m-d\\TH:i:s.v\\Z');

        return [
            'Path' => $path,
            'Guid' => '',
            'Type' => $type,
            'StartTime' => $nullDate,
            'EndTime' => $nullDate,
            'Priority' => $priority,
            'UnreadBy' => '',
        ];
    }

    private function playlistsFromLists(array $response): array
    {
        $records = $response['Records'] ?? null;
        if (! is_array($records)) {
            throw new EnpsWebException('invalid_response', 'Răspunsul Lists ENPS nu conține lista de înregistrări.');
        }

        $playlists = [];
        foreach ($records as $record) {
            if (! is_array($record)) {
                continue;
            }

            $fields = is_array($record['ListData'] ?? null) ? $record['ListData'] : [];
            foreach (($record['ObjectProperties'] ?? []) as $property) {
                if (is_array($property) && is_string($property['FieldName'] ?? null) && array_key_exists('FieldValue', $property)) {
                    $fields[$property['FieldName']] = $property['FieldValue'];
                }
            }
            $fields = array_change_key_case($fields, CASE_LOWER);
            $allFields = array_change_key_case(array_merge($record, $fields), CASE_LOWER);
            $type = $fields['type'] ?? $record['Type'] ?? $record['type'] ?? null;
            if ((string) $type !== '2' && strtoupper((string) $type) !== 'RUNDOWN') {
                continue;
            }

            $title = $fields['title'] ?? $record['Title'] ?? $record['title'] ?? null;
            if (! is_string($title) || trim($title) === '') {
                continue;
            }

            $title = trim($title);
            $workAt = $this->playlistWorkAt($allFields);
            if ($workAt === null && preg_match('/\s*\[(\d{2}\.\d{2}\.\d{4},\s*\d{2}:\d{2})\]\s*$/u', $title, $matches, PREG_OFFSET_CAPTURE)) {
                $workAt = preg_replace('/\s+/u', ' ', trim($matches[1][0]));
                $title = rtrim(substr($title, 0, $matches[0][1]));
            }

            $playlists[] = [
                'title' => mb_substr($title, 0, 300),
                'guid' => $this->safeString($fields['guid'] ?? $record['Guid'] ?? $record['guid'] ?? null),
                'path' => $this->safeString($fields['path'] ?? $record['Path'] ?? $record['path'] ?? null),
                'uri' => $this->safeString($fields['uri'] ?? $record['Uri'] ?? $record['URI'] ?? $record['uri'] ?? null),
                'workAt' => $workAt,
                'modifiedAt' => $this->safeString($fields['modtime'] ?? $record['ModTime'] ?? $record['modTime'] ?? null),
            ];
        }

        return $playlists;
    }

    private function fieldsFromRecord(array $record): array
    {
        $fields = [];
        foreach (['ListData', 'RecordData', 'Data', 'Fields', 'fields', 'BasicContent'] as $key) {
            if (is_array($record[$key] ?? null)) {
                $fields = array_merge($fields, $record[$key]);
            }
        }
        foreach (['ObjectProperties', 'objectProperties', 'Properties', 'properties'] as $key) {
            foreach (($record[$key] ?? []) as $property) {
                if (! is_array($property)) {
                    continue;
                }
                $fieldName = $property['FieldName'] ?? $property['fieldName'] ?? $property['Name'] ?? $property['name'] ?? null;
                if (is_string($fieldName)) {
                    $fields[$fieldName] = $property['FieldValue'] ?? $property['fieldValue'] ?? $property['Value'] ?? $property['value'] ?? null;
                }
            }
        }
        foreach (['RecordPointer', 'recordPointer'] as $key) {
            if (is_array($record[$key] ?? null)) {
                $fields = array_merge($fields, $this->fieldsFromRecord($record[$key]));
            }
        }

        return array_change_key_case(array_merge($record, $fields), CASE_LOWER);
    }

    private function segmentsFromFields(array $fields): array
    {
        $segments = [];
        foreach (['segment', 'segments'] as $key) {
            $value = $fields[$key] ?? null;
            foreach (is_array($value) ? $value : [$value] as $segment) {
                if (is_string($segment) && trim($segment) !== '') {
                    $segments[] = mb_strtoupper(trim($segment), 'UTF-8');
                }
            }
        }
        if ($segments === []) {
            foreach (['status', 'storystatus', 'storytype', 'articletype', 'version'] as $key) {
                $value = $fields[$key] ?? null;
                if (is_string($value) && in_array(strtoupper(trim($value)), ['INTRO', 'INTO', 'OFF', 'BETA', 'LIVE', 'SNC', 'AMB'], true)) {
                    $segments[] = strtoupper(trim($value));
                }
            }
        }

        return array_values(array_unique($segments));
    }

    private function firstText(array $fields, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $fields[strtolower($key)] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return mb_substr(trim($value), 0, 500);
            }
        }

        return null;
    }

    private function playlistWorkAt(array $fields): ?string
    {
        $date = $this->firstText($fields, ['workdate', 'scheduleddate', 'programdate', 'rundowndate', 'broadcastdate', 'startdate', 'nominaldate', 'effectivedate', 'date']);
        $time = $this->firstText($fields, ['worktime', 'scheduledtime', 'programtime', 'rundowntime', 'broadcasttime', 'airtime', 'starttime', 'ontime', 'effectivetime', 'time']);
        if ($date === null || $time === null) {
            foreach ($fields as $key => $value) {
                if (! is_string($value) || preg_match('/mod|creat|updat|last/i', (string) $key)) {
                    continue;
                }
                if ($date === null && preg_match('/date/i', (string) $key)) {
                    $date = trim($value);
                } elseif ($time === null && preg_match('/time/i', (string) $key)) {
                    $time = trim($value);
                }
            }
        }
        if ($date !== null && $time !== null && preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', $time, $matches)) {
            try {
                return CarbonImmutable::parse($date, (string) config('services.enps.timezone', 'Europe/Chisinau'))
                    ->setTime((int) $matches[1], (int) $matches[2], (int) ($matches[3] ?? 0))
                    ->format('d.m.Y, H:i');
            } catch (Throwable) {
                // Continue to the complete timestamp candidates below.
            }
        }

        foreach (['workdatetime', 'scheduleddatetime', 'programdatetime', 'rundowndatetime', 'broadcastdatetime', 'nominaldatetime', 'effectivedatetime', 'datetime', 'worktime', 'scheduledtime', 'programtime', 'rundowntime', 'broadcasttime', 'airtime', 'starttime', 'startdatetime', 'ontime', 'effectivetime', 'programdate', 'rundowndate', 'broadcastdate', 'startdate', 'nominaldate', 'effectivedate', 'date', 'modtime'] as $key) {
            $value = $fields[$key] ?? null;
            if (! is_string($value) && ! is_numeric($value)) {
                continue;
            }
            $timezone = $key === 'modtime'
                ? 'Etc/GMT-3'
                : (string) config('services.enps.timezone', 'Europe/Chisinau');
            $value = trim((string) $value);
            if ($value === '' || $value === '0001-01-01T00:00:00') {
                continue;
            }
            if (preg_match('/^\d{1,2}:\d{2}(?::\d{2})?$/', $value)) {
                continue;
            }

            if (is_numeric($value)) {
                $timestamp = (int) $value;
                if (abs($timestamp) > 9999999999) {
                    $timestamp = (int) floor($timestamp / 1000);
                }

                return CarbonImmutable::createFromTimestamp($timestamp)
                    ->setTimezone($timezone)
                    ->format('d.m.Y, H:i');
            }

            if (preg_match('/^(\d{2}\.\d{2}\.\d{4}),?\s+(\d{2}:\d{2})$/', $value, $matches)) {
                return $matches[1].', '.$matches[2];
            }

            if (preg_match('/^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/', $value, $matches)) {
                $timestamp = (int) $matches[1];
                if (abs($timestamp) > 9999999999) {
                    $timestamp = (int) floor($timestamp / 1000);
                }

                return CarbonImmutable::createFromTimestamp($timestamp)
                    ->setTimezone($timezone)
                    ->format('d.m.Y, H:i');
            }

            try {
                return CarbonImmutable::parse($value, $timezone)
                    ->setTimezone($timezone)
                    ->format('d.m.Y, H:i');
            } catch (Throwable) {
                continue;
            }
        }

        return null;
    }

    private function safeString(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? mb_substr($value, 0, 200) : null;
    }
}
