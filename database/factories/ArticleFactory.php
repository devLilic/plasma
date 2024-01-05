<?php

namespace Database\Factories;

use App\Models\Playlist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Model>
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
            'tehno_title' => $this->faker->word,
            'article_type' => 'BETA',
            'playlist_id' => $playlist->id,
        ];
    }
}
