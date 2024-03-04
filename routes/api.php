<?php

use App\Http\Controllers\API\V1\ExternalImagesController;
use App\Http\Controllers\API\V1\ImagesController;
use App\Http\Controllers\API\V1\PlaylistController;
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

Route::middleware('auth:sanctum')->get('/user', function (Request $request)
{
    return $request->user();
});

Route::prefix('/v1')->group(function (){
    Route::get('/images/search', [ImagesController::class, 'search']);

    Route::get('/images', [ImagesController::class, 'index']);
    Route::delete('/images', [ImagesController::class, 'destroy']);


    Route::get('/playlists/{playlist}', [PlaylistController::class, 'show']);

    Route::get('resources', [ExternalImagesController::class, 'getImages']);
    Route::post('crop', [ExternalImagesController::class, 'crop']);
    Route::post('tags', [ImagesController::class, 'addTags']);

    Route::post('/article', [ArticleController::class, 'store']);
    Route::patch('/article', [ArticleController::class, 'update']);
    Route::delete('/article', [ArticleController::class, 'destroy']);
    Route::delete('/remove-bg', [ArticleController::class, 'removeBg']);

});
