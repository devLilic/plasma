<?php

namespace App\Http\Controllers;

use App\Services\LBPortal\LBPortalConnectionSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LBPortalConnectionController extends Controller
{
    public function connection(LBPortalConnectionSettings $settings): JsonResponse
    {
        return response()->json($settings->connection())->header('Cache-Control', 'private, no-store')->header('Pragma', 'no-cache');
    }

    public function update(Request $request, LBPortalConnectionSettings $settings): RedirectResponse
    {
        $data = $request->validate([
            'host' => ['required', 'ipv4'],
            'port' => ['required', 'integer', 'between:1,65535'],
            'accessKey' => ['nullable', 'string', 'min:32', 'max:512', 'regex:/^\S+$/'],
            'clearAccessKey' => ['sometimes', 'boolean'],
        ]);
        $settings->save($data['host'], (int) $data['port'], $data['accessKey'] ?? null, $data['clearAccessKey'] ?? false);
        return back()->with('status', 'Conexiunea LB-Portal a fost salvată.');
    }
}
