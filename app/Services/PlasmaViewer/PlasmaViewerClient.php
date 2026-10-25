<?php

namespace App\Services\PlasmaViewer;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PlasmaViewerClient
{
    public function __construct(private readonly PlasmaViewerLauncher $launcher) {}

    public function health(): array
    {
        return $this->request('GET', '/v1/health');
    }

    public function state(): array
    {
        return $this->request('GET', '/v1/state');
    }

    public function command(array $command): array
    {
        return $this->request('POST', '/v1/commands', $command);
    }

    public function defaultImage(): ?array
    {
        $response = $this->requestResponse('GET', '/v1/default-image');
        if ($response->status() === 404) return null;
        if (! $response->successful()) throw new RuntimeException($response->json('error') ?: 'Imaginea implicită PlasmaViewer nu a putut fi citită.');

        return ['body' => $response->body(), 'contentType' => $response->header('Content-Type') ?: 'application/octet-stream'];
    }

    private function request(string $method, string $path, array $payload = []): array
    {
        $response = $this->requestResponse($method, $path, $payload);
        if (! $response->successful()) throw new RuntimeException($response->json('error') ?: 'PlasmaViewer a refuzat comanda.');

        return $response->json();
    }

    private function requestResponse(string $method, string $path, array $payload = []): Response
    {
        try {
            return $this->send($method, $path, $payload);
        } catch (ConnectionException) {
            $this->launcher->launch();
        }

        $deadline = microtime(true) + ((int) config('plasma_viewer.startup_timeout_ms') / 1000);
        do {
            usleep(200_000);
            try {
                return $this->send($method, $path, $payload);
            } catch (ConnectionException) {
                // Viewer is still starting.
            }
        } while (microtime(true) < $deadline);

        throw new RuntimeException('PlasmaViewer nu a pornit în intervalul configurat.');
    }

    private function send(string $method, string $path, array $payload): Response
    {
        $request = $this->http();
        $response = $method === 'GET'
            ? $request->get($this->url($path))
            : $request->post($this->url($path), $payload);

        return $response;
    }

    private function http(): PendingRequest
    {
        return Http::acceptJson()
            ->withToken((string) config('plasma_viewer.token'))
            ->connectTimeout(0.4)
            ->timeout(6);
    }

    private function url(string $path): string
    {
        return sprintf('http://%s:%d%s', config('plasma_viewer.host'), config('plasma_viewer.port'), $path);
    }
}
