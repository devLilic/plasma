<?php

namespace Database\Seeders;

use App\Models\Image;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ImagesSeeder extends Seeder {

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $images = [
            'img_20220913_1.jpg',
            'img_20220913_2.jpg',
            'img_20220913_3.jpg',
            'img_20220913_4.jpg',
            'img_20220913_5.jpg',
            'img_20220913_6.jpg',
        ];
        foreach ($images as $image) {
            Image::create([
                "url" => $image,
            ]);
        }

    }
}
