<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageResource;
use App\Models\Image;
use App\Models\Tag;
use Illuminate\Http\Request;

class ImagesController extends Controller
{

    public function index()
    {
        return ImageResource::collection(Image::with('tags')->get());
    }
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2|max:20'
        ]);

        $query = $request->input('query');
        $tags = Tag::where('title', 'like', "%$query%")->get();
        $images = collect();
        foreach ($tags as $tag) {
            $tag->images()->with('tags')->get()->map(function ($image) use ($images){
                if (!$images->contains($image)) {
                    $images->add($image);
                }
            });
        }

        return ImageResource::collection($images);
//        if ($request->query !== "") {
//            $images = collect();
//            foreach ($tags as $tag) {
//                $tag->images()->with('tags')->get()->map(function ($image) use ($images)
//                {
//                    if (!$images->contains($image)) {
//                        $image->url = asset("images/$image->url");
//                        $images->add($image);
//                    }
//                });
//            }
//        } else {
//            $images = Image::with('tags')->take(20)->get();
//            $images->map(fn($image) => $image->url = asset("images/$image->url"));
//        }
//
//        return $images;
    }
}
