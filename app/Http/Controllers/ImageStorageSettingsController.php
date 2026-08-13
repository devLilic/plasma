<?php

namespace App\Http\Controllers;

use App\Models\ApplicationSetting;
use App\Services\Images\ImageStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageStorageSettingsController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:500'],
        ]);
        $path = realpath($validated['path']);

        if ($path === false || ! is_dir($path)) {
            throw ValidationException::withMessages([
                'path' => 'Folderul indicat nu există pe calculatorul server.',
            ]);
        }

        $probe = $path.DIRECTORY_SEPARATOR.'.plasma-write-test-'.Str::uuid();
        $written = @file_put_contents($probe, 'plasma', LOCK_EX);

        if ($written === false) {
            throw ValidationException::withMessages([
                'path' => 'Aplicația nu poate scrie în folderul indicat.',
            ]);
        }

        if (! @unlink($probe)) {
            throw ValidationException::withMessages([
                'path' => 'Aplicația poate scrie, dar nu poate șterge fișiere din folderul indicat.',
            ]);
        }

        ApplicationSetting::query()->updateOrCreate(
            ['key' => ImageStorage::SETTING_KEY],
            ['value' => $path],
        );

        return back()->with('status', 'Locația bibliotecii media a fost actualizată.');
    }
}
