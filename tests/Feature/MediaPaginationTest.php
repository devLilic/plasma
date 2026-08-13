<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MediaPaginationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_media_libraries_are_paginated_with_twenty_images_per_page(): void
    {
        Image::factory()->count(25)->create();

        $this->get(route('images.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Images/ImagesPage')
            ->has('images.data', 20)
            ->where('images.meta.per_page', 20)
            ->where('images.meta.total', 25));

        $this->get(route('playlists.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Playlist/PlaylistPage')
            ->has('images.data', 20)
            ->where('images.meta.per_page', 20)
            ->where('images.meta.total', 25));
    }

    public function test_tag_search_results_are_also_paginated(): void
    {
        $tag = Tag::create(['title' => 'energie']);
        Image::factory()->count(21)->create()->each(fn (Image $image) => $image->tags()->attach($tag));
        Image::factory()->count(3)->create();

        $this->get(route('images.index', ['search' => 'energ', 'page' => 2]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('images.data', 1)
                ->where('images.meta.current_page', 2)
                ->where('images.meta.total', 21)
                ->where('filters.search', 'energ'));
    }
}
