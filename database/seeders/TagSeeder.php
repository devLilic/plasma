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
        $images = Image::all();

        $tags = [
            Tag::firstOrCreate(['title' => 'EU']),
            Tag::firstOrCreate(['title' => 'coloana']),
            Tag::firstOrCreate(['title' => 'incendiu']),
            Tag::firstOrCreate(['title' => 'sedinta']),
            Tag::firstOrCreate(['title' => 'deces']),
            Tag::firstOrCreate(['title' => 'virus']),
        ];

        foreach ($tags as $index => $tag) {
            $images[$index]->tags()->attach($tag);
        }
    }
}
