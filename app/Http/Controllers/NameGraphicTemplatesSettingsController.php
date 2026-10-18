<?php

namespace App\Http\Controllers;

use App\Services\Articles\NameGraphicTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NameGraphicTemplatesSettingsController extends Controller
{
    public function update(Request $request, NameGraphicTemplates $settings): RedirectResponse
    {
        $validated = $request->validate([
            'templates' => ['present', 'array', 'max:100'],
            'templates.*' => ['nullable', 'string', 'max:150'],
        ]);
        $settings->save($validated['templates']);
        return back()->with('status', 'Template-urile de burtiere pentru persoane au fost actualizate.');
    }
}
