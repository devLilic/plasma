<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageResource;
use App\Models\Image;
use Carbon\Carbon;
use Facades\App\Services\Images\GoogleImages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Nette\Utils\Image as ImageProcessor;

class ExternalImagesController extends Controller
{
    public function getImages(Request $request)
    {
        $request->validate([
            'query' => 'string|required'
        ]);
        return GoogleImages::getImages($request->query->get('query'));
    }

    public function cropImage(ImageProcessor $image, $percentCrop)
    {
        $image_width = $image->width;
        $image_height = $image->height;
        $section = [
            'x' => (int) ($image_width * $percentCrop['x'] / 100),
            'y' => (int) ($image_height * $percentCrop['y'] / 100),
            'width' => (int) ($image_width * $percentCrop['width'] / 100),
            'height' => (int) ($image_height * $percentCrop['height'] / 100),
        ];

        $image->crop($section['x'], $section['y'], $section['width'], $section['height']);

        return $image;
    }

    public function crop(Request $request)
    {
        try {
            $file = Http::get($request->data['url']);
            if ($file->failed()) {
                throw new \Exception($file->reason(), $file->status());
            }
        } catch (\Exception $e) {
            return json_encode(['error' => ['message' => $e->getMessage(), 'code' => $e->getCode()]]);
        }


        try{
            $image = imagecreatefromstring($file->body());
        } catch (\Exception $e) {
            return json_encode(['error' => ['message' => $e->getMessage(), 'code' => $e->getCode()]]);
        }

        $imgProcessor = new ImageProcessor($image);
        imagedestroy($image);

        $cropped = $this->cropImage($imgProcessor, $request->data['section']);

        $uploaded_today = Image::whereDate('created_at', Carbon::today())->count();
        $order_number = $uploaded_today + 1;

        $date = Carbon::now()->format('Ymd');

        do {
            $fileName = "img_{$date}_{$order_number}.jpg";
            $order_number++;
        } while (Image::where('url', $fileName)->count() !== 0);

        $path = Storage::disk('images')->path($fileName);

//        imageflip($image, IMG_FLIP_HORIZONTAL);
        imagejpeg($cropped->imageResource, $path);

        $image = Image::create([
            'url' => $fileName,
            'sourceUrl' => $request->data['url']
        ]);


        return json_encode([
            'id' => $image->id,
            'url' => Storage::disk('images')->url($image->url),
            'sourceUrl' => $image->sourceUrl,
            'isNew' => $image->isNew
        ]);
    }
}
