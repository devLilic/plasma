<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Services\Images\ImageMatcher;
use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PlaylistsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $playlists = Playlist::orderBy('created_at', 'DESC')->take(6)->get();
        $search = trim($request->string('search')->toString());
        $images = Image::query()
            ->when($search !== '', fn ($query) => $query->whereHas('tags', fn ($tags) => $tags->where('title', 'like', '%'.$search.'%')))
            ->with('tags')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $data = [
            'playlists' => $playlists,
            'images' => ImageResource::collection($images),
            'filters' => ['search' => $search],
        ];

        if (count($playlists) > 0) {
            $data['articles'] = ArticleResource::collection(Article::where('playlist_id', $playlists[0]->id)->with('image.tags')->orderBy('playlist_order')->get());
        }

        return Inertia::render('Playlist/PlaylistPage', $data);

        //        return (count($playlists) > 0) ?
        //            Inertia::render('Playlist/PlaylistPage', [
        //                'playlists' => $playlists,
        //                'articles' => ArticleResource::collection(Article::where('playlist_id', $playlists[0]->id)->get()),
        //            ]) :
        //            Inertia::render('Playlist/PlaylistPage', [
        //                'playlists' => $playlists,
        //            ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(FileUploadRequest $request, ImageMatcher $imageMatcher)
    {
        $file = $request->validated('file');

        $latest_playlists = Playlist::latest()->take(2)->get();
        $previous_articles = collect();
        if (count($latest_playlists) == 2) {
            $previous_articles = $latest_playlists[0]->articles->concat($latest_playlists[1]->articles)->unique(function ($article) {
                return $article->subtitle;
            });
        } elseif (count($latest_playlists) == 1) {
            $previous_articles = $latest_playlists[0]->articles;
        }

        $content = $request->validated('file')->getContent();
        $articles = ArticlesService::generate($content);

        $playlist = DB::transaction(function () use ($file, $articles, $previous_articles, $imageMatcher) {
            $playlist = Playlist::create([
                'title' => today()->format('d m Y').' '.Str::of($file->getClientOriginalName())->before('.HTM')->toString(),
            ]);
            $playlist_order = 1;
            foreach ($articles as $article) {
                $image = $this->findImage($previous_articles, $article->search_slug, $article->title, $imageMatcher);
                Article::create([
                    'title' => $article->title,
                    'subtitle' => $article->search_slug,
                    'slugs' => Arr::join($article->slugs, '||'),
                    'intro' => $article->content,
                    'article_type' => $article->type,
                    'playlist_id' => $playlist->id,
                    'playlist_order' => $playlist_order++,
                    'image_id' => $image ?: null,
                ]);
                if ($image) {
                    Image::whereKey($image)->update(['last_used_at' => now()]);
                }
            }

            return $playlist;
        });

        return redirect()->to('/playlists/'.$playlist->id);
    }

    private function findImage($previous_articles, string $slug, string $title, ImageMatcher $imageMatcher)
    {
        $found_article = $previous_articles
            ->where('subtitle', $slug)
            ->first(fn ($article) => $article->image_id !== null);
        if ($found_article) {
            return $found_article->image_id;
        }

        $normalizedSlug = collect(explode(' ', trim($slug)))
            ->filter(fn ($word) => ! (int) $word && strlen($word) > 2)
            ->implode(' ');
        $found_article = $previous_articles
            ->where('subtitle', $normalizedSlug)
            ->first(fn ($article) => $article->image_id !== null);
        if ($found_article) {
            return $found_article->image_id;
        }

        return $imageMatcher->bestMatch([$title, $slug])?->id;
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $playlist = Playlist::find($id);
        if (! $playlist) {
            return redirect()->to('/playlists');
        }

        return Inertia::render('Playlist/PlaylistShowPage', [
            'articles' => ArticleResource::collection(Article::where('playlist_id', $id)->with('image.tags')->orderBy('playlist_order')->get()),
        ]);
    }

    /**
     * Remove a playlist and its articles while preserving the media library.
     */
    public function destroy(Playlist $playlist)
    {
        $playlist->delete();

        return redirect()->route('playlists.index');
    }
}
