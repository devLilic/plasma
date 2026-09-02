<?php

use App\Http\Controllers\API\V1\ExternalImagesController;
use App\Http\Controllers\API\V1\ImagesController;
use App\Http\Controllers\API\V1\PlaylistController;
use App\Http\Controllers\API\V1\TagsController;
use App\Http\Controllers\ArticleController;
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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('/v1')->middleware('auth:sanctum')->group(function () {
    Route::get('/images/search', [ImagesController::class, 'search']);
    Route::get('/images/stale', [ImagesController::class, 'stale']);
    Route::delete('/images/stale', [ImagesController::class, 'cleanStale']);

    Route::get('/images', [ImagesController::class, 'index']);
    Route::get('/tags', [TagsController::class, 'index']);
    Route::delete('/images/{image}', [ImagesController::class, 'destroy']);
    Route::patch('/images/{image}', [ImagesController::class, 'update']);

    Route::get('/playlists/{playlist}', [PlaylistController::class, 'show']);

    Route::post('crop', [ExternalImagesController::class, 'crop']);

    Route::post('/article', [ArticleController::class, 'store']);
    Route::patch('/article', [ArticleController::class, 'update']);
    Route::patch('/articles/{article}', [ArticleController::class, 'updateContent']);
    Route::patch('/articles/{article}/highlights', [ArticleController::class, 'updateTextHighlight']);
    Route::delete('/article', [ArticleController::class, 'destroy']);
    Route::delete('/remove-bg', [ArticleController::class, 'removeBg']);

    Route::post('/files', [App\Http\Controllers\ImagesController::class, 'store']);
});
