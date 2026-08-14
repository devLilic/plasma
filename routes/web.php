<?php

use App\Http\Controllers\ImagesController;
use App\Http\Controllers\ImageStorageSettingsController;
use App\Http\Controllers\PlasmaViewerController;
use App\Http\Controllers\PlasmaViewerMediaController;
use App\Http\Controllers\PlaylistsController;
use App\Http\Controllers\PlaylistTitleExclusionsSettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StoredImageController;
use App\Http\Controllers\StoredImageThumbnailController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return redirect()->to('playlists');
    //    return Inertia::render('Welcome', [
    //        'canLogin' => Route::has('login'),
    //        'canRegister' => Route::has('register'),
    //        'laravelVersion' => Application::VERSION,
    //        'phpVersion' => PHP_VERSION,
    //    ]);
});

Route::get('/viewer/media/{article}/{image}', PlasmaViewerMediaController::class)
    ->middleware('signed')
    ->name('viewer.media');

Route::get('/dashboard', function () {
    return redirect()->route('playlists.index');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::patch('/profile/image-storage', [ImageStorageSettingsController::class, 'update'])->name('profile.image-storage.update');
    Route::patch('/profile/playlist-title-exclusions', [PlaylistTitleExclusionsSettingsController::class, 'update'])
        ->name('profile.playlist-title-exclusions.update');

    Route::resource('playlists', PlaylistsController::class)
        ->only(['index', 'store', 'show', 'destroy'])
        ->where(['playlist' => '[0-9]+']);
    Route::post('/playlists/{playlist}/refresh-parsing', [PlaylistsController::class, 'refreshParsing'])
        ->whereNumber('playlist')
        ->name('playlists.refresh-parsing');

    Route::get('/image', [ImagesController::class, 'index'])->name('images.index');
    Route::get('/image/create', [ImagesController::class, 'create'])->name('images.create');
    Route::get('/image-thumbnails/{path}', StoredImageThumbnailController::class)->where('path', '.*')->name('images.thumbnail');
    Route::get('/images/{path}', StoredImageController::class)->where('path', '.*')->name('images.file');
    Route::get('/plasma-viewer/state', [PlasmaViewerController::class, 'state'])->name('viewer.state');
    Route::post('/plasma-viewer/commands', [PlasmaViewerController::class, 'command'])->name('viewer.command');
});

require __DIR__.'/auth.php';
