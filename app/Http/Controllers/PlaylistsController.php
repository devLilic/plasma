<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Services\Images\ImageMatcher;
use App\Services\Playlists\PlaylistSourceStorage;
use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

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
    public function store(
        FileUploadRequest $request,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
    ) {
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
        $sourcePath = $sourceStorage->store($file, $content);

        try {
            $playlist = DB::transaction(function () use ($file, $articles, $previous_articles, $imageMatcher, $sourcePath) {
                $playlist = Playlist::create([
                    'title' => today()->format('d m Y').' '.Str::of($file->getClientOriginalName())->before('.HTM')->toString(),
                    'source_htm_path' => $sourcePath,
                ]);
                $this->synchronizeArticles($playlist, $articles, $previous_articles, $imageMatcher);

                return $playlist;
            });
        } catch (Throwable $exception) {
            $sourceStorage->deletePath($sourcePath);

            throw $exception;
        }

        $sourceStorage->prune();

        return redirect()->to('/playlists/'.$playlist->id);
    }

    public function refreshParsing(
        Playlist $playlist,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
    ) {
        if (! $sourceStorage->exists($playlist)) {
            return back()->withErrors([
                'playlist' => 'Fișierul HTM sursă nu mai este disponibil pentru acest playlist.',
            ]);
        }

        $articles = ArticlesService::generate($sourceStorage->contents($playlist));
        $existingArticles = $playlist->articles()->get();

        DB::transaction(function () use ($playlist, $articles, $existingArticles, $imageMatcher) {
            $this->synchronizeArticles(
                $playlist,
                $articles,
                $existingArticles,
                $imageMatcher,
                removeMissing: true,
            );
        });

        return redirect()->route('playlists.show', $playlist)->with('status', 'playlist-parsing-refreshed');
    }

    /**
     * @param  array<int, \App\Services\Articles\Article>  $parsedArticles
     * @param  Collection<int, Article>  $imageCandidates
     */
    private function synchronizeArticles(
        Playlist $playlist,
        array $parsedArticles,
        Collection $imageCandidates,
        ImageMatcher $imageMatcher,
        bool $removeMissing = false,
    ): void {
        $availableArticles = $playlist->articles()->get()->keyBy('id');
        $reservedArticleIds = collect($parsedArticles)
            ->map(fn ($parsedArticle) => $availableArticles
                ->first(fn (Article $article) => $article->subtitle === $parsedArticle->search_slug)?->id)
            ->filter()
            ->unique();
        $retainedIds = [];

        foreach ($parsedArticles as $order => $parsedArticle) {
            $article = $this->matchingArticle(
                $availableArticles,
                $parsedArticle->search_slug,
                $parsedArticle->slugs,
                $reservedArticleIds,
            );
            $imageId = $article?->image_id
                ?: $this->findImage($imageCandidates, $parsedArticle->search_slug, $parsedArticle->title, $imageMatcher);
            $attributes = [
                'title' => $parsedArticle->title,
                'subtitle' => $parsedArticle->search_slug,
                'technical_title' => $parsedArticle->technical_title,
                'slugs' => Arr::join($parsedArticle->slugs, '||'),
                'intro' => $parsedArticle->content,
                'content_sections' => $parsedArticle->sections,
                'article_type' => $parsedArticle->type,
                'article_types' => $parsedArticle->types,
                'playlist_order' => $order + 1,
                'image_id' => $imageId ?: null,
            ];

            if ($article) {
                $article->update($attributes);
                $availableArticles->forget($article->id);
            } else {
                $article = $playlist->articles()->create($attributes);
            }

            $retainedIds[] = $article->id;
            if ($imageId) {
                Image::whereKey($imageId)->update(['last_used_at' => now()]);
            }
        }

        if ($removeMissing) {
            $playlist->articles()->whereNotIn('id', $retainedIds)->delete();
        }
    }

    /** @param  array<int, string>  $slugs */
    private function matchingArticle(
        Collection $articles,
        string $subtitle,
        array $slugs,
        Collection $reservedArticleIds,
    ): ?Article {
        $exactMatch = $articles->first(fn (Article $article) => $article->subtitle === $subtitle);
        if ($exactMatch) {
            return $exactMatch;
        }

        return $articles->first(function (Article $article) use ($slugs, $reservedArticleIds) {
            if ($reservedArticleIds->contains($article->id)) {
                return false;
            }

            $storedSlugs = explode('||', (string) $article->slugs);

            return count(array_intersect($storedSlugs, $slugs)) > 0;
        });
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
    public function show(string $id, PlaylistSourceStorage $sourceStorage)
    {
        $playlist = Playlist::find($id);
        if (! $playlist) {
            return redirect()->to('/playlists');
        }

        return Inertia::render('Playlist/PlaylistShowPage', [
            'playlist' => [
                'id' => $playlist->id,
                'title' => $playlist->title,
                'can_refresh_parsing' => $sourceStorage->exists($playlist),
            ],
            'articles' => ArticleResource::collection(Article::where('playlist_id', $id)->with('image.tags')->orderBy('playlist_order')->get()),
        ]);
    }

    /**
     * Remove a playlist and its articles while preserving the media library.
     */
    public function destroy(Playlist $playlist, PlaylistSourceStorage $sourceStorage)
    {
        $playlist->delete();
        $sourceStorage->delete($playlist);

        return redirect()->route('playlists.index');
    }
}
