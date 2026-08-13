<?php

namespace App\Services\PlasmaViewer;

use RuntimeException;
use Symfony\Component\Process\Process;

class PlasmaViewerLauncher
{
    public function launch(): void
    {
        if (! config('plasma_viewer.launch_enabled')) {
            throw new RuntimeException('PlasmaViewer nu rulează, iar lansarea automată este dezactivată.');
        }

        $executable = (string) config('plasma_viewer.executable');
        if ($executable === '' || ! is_file($executable)) {
            throw new RuntimeException('Executabilul PlasmaViewer nu a fost găsit. Verifică PLASMA_VIEWER_EXECUTABLE.');
        }

        $process = new Process([$executable], null, [
            'PLASMA_VIEWER_PORT' => (string) config('plasma_viewer.port'),
            'PLASMA_VIEWER_TOKEN' => (string) config('plasma_viewer.token'),
        ]);
        $process->disableOutput();
        $process->start();
    }
}
