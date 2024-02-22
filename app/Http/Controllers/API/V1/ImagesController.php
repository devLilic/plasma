<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Tag;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImagesController extends Controller {

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
            $tag->images()->with('tags')->get()->map(function ($image) use ($images)
            {
                if (!$images->contains($image)) {
                    $images->add($image);
                }
            });
        }

        return ImageResource::collection($images);
    }

    public function destroy(Request $request)
    {
        try {
            $image = Image::where('id', $request->id)->firstOrFail();
            $id = $image->id;
            $image->tags()->detach();
            Article::where('image_id', $image->id)->update(['image_id' => null]);
            Storage::disk('images')->delete($image->url);
            $image->delete();
            if ($id !== 0) {
                return ['id' => $id];
            }
        } catch (ModelNotFoundException $e) {
            return ['error' => 'File not found ' . $e];
        }
    }

    public function addTags(Request $request)
    {
        $image = Image::find($request['data']['id']);
        $words = explode(",", $request['data']['tags']);
        $tagIds = [];
        foreach ($words as $word) {
            $word = trim($word);
            if ($word !== ''){
                $tag = Tag::firstOrCreate(["title" => $word]);
                $tagIds[] = $tag->id;
            }
        }

        if(count($tagIds)){
            $image->tags()->sync($tagIds);
        }

        return $image;
    }
}
