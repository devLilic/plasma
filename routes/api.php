<?php

use App\Http\Controllers\API\V1\ImagesController;
use App\Http\Controllers\API\V1\PlaylistController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request)
{
    return $request->user();
});
Route::get('/images/search', [ImagesController::class, 'search']);

Route::get('/images', [ImagesController::class, 'index']);


Route::get('/playlists/{playlist}', [PlaylistController::class, 'show']);
