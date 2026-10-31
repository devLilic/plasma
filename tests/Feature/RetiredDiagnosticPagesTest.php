<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RetiredDiagnosticPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_llc_and_enps_diagnostic_pages_and_actions_are_removed(): void
    {
        $this->get('/llc-test')->assertNotFound();

        foreach ([
            ['GET', '/enps-test'],
            ['POST', '/enps-test/connect'],
            ['POST', '/enps-test/ping'],
            ['POST', '/enps-test/playlist-content'],
            ['POST', '/enps-test/refresh-playlists'],
            ['POST', '/enps-test/disconnect'],
        ] as [$method, $uri]) {
            $this->call($method, $uri)->assertNotFound();
        }
    }
}
