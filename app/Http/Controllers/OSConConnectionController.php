<?php

namespace App\Http\Controllers;

use App\Services\OSCon\OSConConnectionSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OSConConnectionController extends Controller
{
    public function connection(OSConConnectionSettings $settings): JsonResponse
    {
        return response()->json($settings->connection())->header('Cache-Control', 'private, no-store')->header('Pragma', 'no-cache');
    }

    public function update(Request $request, OSConConnectionSettings $settings): RedirectResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'min:32', 'max:512', 'regex:/^\S+$/'],
            'clearToken' => ['sometimes', 'boolean'],
        ]);
        $settings->save($data['endpoint'], $data['token'] ?? null, $data['clearToken'] ?? false);
        return back()->with('status', 'Conexiunea OSCon a fost salvată.');
    }
}
