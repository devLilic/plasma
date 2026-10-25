<?php

use App\Http\Controllers\EnpsPlaylistImportController;
use App\Http\Controllers\EnpsTestController;
use App\Http\Controllers\ImagesController;
use App\Http\Controllers\ImageStorageSettingsController;
use App\Http\Controllers\ImageQualitySettingsController;
use App\Http\Controllers\LBPortalConnectionController;
use App\Http\Controllers\NameGraphicTemplatesSettingsController;
use App\Http\Controllers\OSConConnectionController;
use App\Http\Controllers\PlaylistMosOverrideController;
use App\Http\Controllers\PlaylistMosSequenceOrderController;
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
    Route::get('/llc-test', fn () => Inertia::render('LLC/TestPage'))->name('llc.test');
    Route::get('/enps-test', [EnpsTestController::class, 'index'])->name('enps.test');
    Route::post('/enps-test/connect', [EnpsTestController::class, 'connect'])->name('enps.connect');
    Route::post('/enps-test/ping', [EnpsTestController::class, 'ping'])->name('enps.ping');
    Route::post('/enps-test/playlist-content', [EnpsTestController::class, 'playlistContent'])->name('enps.playlist-content');
    Route::post('/enps-test/refresh-playlists', [EnpsTestController::class, 'refreshPlaylists'])->name('enps.refresh-playlists');
    Route::post('/enps-test/disconnect', [EnpsTestController::class, 'disconnect'])->name('enps.disconnect');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::patch('/profile/image-storage', [ImageStorageSettingsController::class, 'update'])->name('profile.image-storage.update');
    Route::patch('/profile/image-quality', [ImageQualitySettingsController::class, 'update'])->name('profile.image-quality.update');
    Route::patch('/profile/oscon', [OSConConnectionController::class, 'update'])->name('profile.oscon.update');
    Route::get('/oscon/connection', [OSConConnectionController::class, 'connection'])->name('oscon.connection');
    Route::patch('/profile/lb-portal', [LBPortalConnectionController::class, 'update'])->name('profile.lb-portal.update');
    Route::get('/lb-portal/connection', [LBPortalConnectionController::class, 'connection'])->name('lb-portal.connection');
    Route::patch('/profile/playlist-title-exclusions', [PlaylistTitleExclusionsSettingsController::class, 'update'])
        ->name('profile.playlist-title-exclusions.update');
    Route::patch('/profile/mos-name-graphics', [NameGraphicTemplatesSettingsController::class, 'update'])
        ->name('profile.mos-name-graphics.update');

    Route::post('/playlists/enps/catalog', [EnpsPlaylistImportController::class, 'catalog'])->name('playlists.enps.catalog');
    Route::post('/playlists/enps/import', [EnpsPlaylistImportController::class, 'import'])->name('playlists.enps.import');
    Route::resource('playlists', PlaylistsController::class)
        ->only(['index', 'store', 'show', 'destroy'])
        ->where(['playlist' => '[0-9]+']);
    Route::post('/playlists/{playlist}/refresh-parsing', [PlaylistsController::class, 'refreshParsing'])
        ->whereNumber('playlist')
        ->name('playlists.refresh-parsing');
    Route::patch('/playlists/{playlist}/mos/{objectKey}', [PlaylistMosOverrideController::class, 'update'])->whereNumber('playlist')->name('playlists.mos.update');
    Route::delete('/playlists/{playlist}/mos/{objectKey}', [PlaylistMosOverrideController::class, 'reset'])->whereNumber('playlist')->name('playlists.mos.reset');
    Route::patch('/playlists/{playlist}/articles/{article}/mos-order', [PlaylistMosSequenceOrderController::class, 'update'])
        ->whereNumber('playlist')
        ->whereNumber('article')
        ->name('playlists.mos-order.update');
    Route::get('/playlists/{playlist}/mos-overrides', [PlaylistMosOverrideController::class, 'index'])->whereNumber('playlist')->name('playlists.mos-overrides.index');
    Route::delete('/playlists/{playlist}/mos-overrides/{override}', [PlaylistMosOverrideController::class, 'destroy'])->whereNumber('playlist')->name('playlists.mos-overrides.destroy');

    Route::get('/image', [ImagesController::class, 'index'])->name('images.index');
    Route::get('/image/create', [ImagesController::class, 'create'])->name('images.create');
    Route::get('/image-thumbnails/{path}', StoredImageThumbnailController::class)->where('path', '.*')->name('images.thumbnail');
    Route::get('/images/{path}', StoredImageController::class)->where('path', '.*')->name('images.file');
    Route::get('/plasma-viewer/state', [PlasmaViewerController::class, 'state'])->name('viewer.state');
    Route::get('/plasma-viewer/default-image', [PlasmaViewerController::class, 'defaultImage'])->name('viewer.default-image');
    Route::post('/plasma-viewer/commands', [PlasmaViewerController::class, 'command'])->name('viewer.command');
});

require __DIR__.'/auth.php';
