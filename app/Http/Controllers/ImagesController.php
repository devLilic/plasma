<?php

namespace App\Http\Controllers;

use App\Http\Resources\ImageResource;
use App\Models\Image;
use Inertia\Inertia;

class ImagesController extends Controller
{
    public function index()
    {
        $images = ImageResource::collection(Image::orderBy('created_at', 'DESC')->take(30)->with('tags')->get());
        return Inertia::render('Images/ImagesPage', [
            'images' => $images,
        ]);
    }
}
