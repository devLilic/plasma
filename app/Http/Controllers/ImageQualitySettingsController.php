<?php

namespace App\Http\Controllers;

use App\Services\Images\ImageQualitySettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ImageQualitySettingsController extends Controller
{
    public function update(Request $request, ImageQualitySettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'width' => ['required', 'integer', 'min:1', 'max:10000'],
            'height' => ['required', 'integer', 'min:1', 'max:10000'],
        ]);

        $settings->save($validated['width'], $validated['height']);

        return back()->with('status', 'Dimensiunea minimă a imaginilor a fost actualizată.');
    }
}
