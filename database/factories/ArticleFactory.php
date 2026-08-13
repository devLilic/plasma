<?php

namespace Database\Factories;

use App\Models\Model;
use App\Models\Playlist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Model>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $playlist = Playlist::factory()->create();

        return [
            'subtitle' => $this->faker->word,
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
        ];
    }
}
