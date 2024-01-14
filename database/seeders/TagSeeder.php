<?php

namespace Database\Seeders;

use App\Models\Image;
use App\Models\Tag;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder {

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $image = Image::first();

        $tag = Tag::firstOrCreate([
            'title' => 'test_tag'
        ]);

        $image->tags()->attach($tag);
    }
}
