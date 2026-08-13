<?php

return [
    'host' => '127.0.0.1',
    'port' => (int) env('PLASMA_VIEWER_PORT', 47832),
    'token' => env('PLASMA_VIEWER_TOKEN', 'plasma-viewer-local-development-token'),
    'executable' => env('PLASMA_VIEWER_EXECUTABLE', base_path('plasmaViewer/release/0.1.0/win-unpacked/PlasmaViewer.exe')),
    'launch_enabled' => env('PLASMA_VIEWER_LAUNCH_ENABLED', true),
    'startup_timeout_ms' => (int) env('PLASMA_VIEWER_STARTUP_TIMEOUT_MS', 5000),
];
