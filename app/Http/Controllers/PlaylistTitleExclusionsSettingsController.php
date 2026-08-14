<?php

namespace App\Http\Controllers;

use App\Services\Playlists\PlaylistTitleExclusions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PlaylistTitleExclusionsSettingsController extends Controller
{
    public function update(Request $request, PlaylistTitleExclusions $settings): RedirectResponse
    {
        $validated = $request->validate([
            'terms' => ['present', 'array', 'max:100'],
            'terms.*' => ['nullable', 'string', 'max:100'],
        ]);

        $settings->save($validated['terms']);

        return back()->with('status', 'Lista titlurilor excluse a fost actualizată.');
    }
}
