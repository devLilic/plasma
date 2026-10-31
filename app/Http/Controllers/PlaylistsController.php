<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ImageResource;
use App\Models\Article;
use App\Models\Image;
use App\Models\Playlist;
use App\Services\Enps\EnpsBasicContent;
use App\Services\Enps\EnpsWebClient;
use App\Services\Enps\EnpsWebException;
use App\Services\Enps\EnpsWebSession;
use App\Services\Images\ImageMatcher;
use App\Services\Playlists\EnpsPlaylistAdapter;
use App\Services\Playlists\EnpsPlaylistItems;
use App\Services\Playlists\PlaylistImporter;
use App\Services\Playlists\PlaylistSourceStorage;
use App\Services\Playlists\PlaylistTitleExclusions;
use Facades\App\Services\Articles\ArticlesService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

class PlaylistsController extends Controller
{
    public function refreshMos(Request $request, Playlist $playlist, Article $article, EnpsWebSession $enpsSession, PlaylistSourceStorage $sourceStorage): JsonResponse
    {
        if ($playlist->source_type !== 'enps' || $article->playlist_id !== $playlist->id) {
            return response()->json(['message' => 'Articolul nu aparține unui playlist ENPS.'], 422);
        }

        $items = $playlist->enpsItems()->orderBy('position')->get();
        $articles = $playlist->articles()->orderBy('playlist_order')->get();
        try {
            $snapshot = json_decode($sourceStorage->contents($playlist), true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return response()->json(['message' => 'Sursa articolului nu poate fi atribuită sigur. Reîmprospătează playlistul înainte să actualizezi MOS.'], 409);
        }
        $resolution = $this->enpsItemsForArticle($article, $articles, $items, is_array($snapshot) ? $snapshot : []);
        if ($resolution['ambiguous']) {
            return response()->json(['message' => 'Sursa MOS este ambiguă pentru acest articol. Reîmprospătează playlistul înainte să actualizezi MOS.'], 409);
        }
        $selectedItems = $resolution['items'];
        if ($selectedItems->isEmpty()) {
            return response()->json(['message' => 'Nu au fost găsite înregistrările ENPS pentru articolul curent.'], 422);
        }

        $stage = 'connection';
        try {
            $connection = $enpsSession->connectionFromSession($request);
            if ($connection === null || blank($connection['tokens']['nom'] ?? null)) {
                $client = new EnpsWebClient;
                $connection = $client->connect();
            } else {
                $client = $enpsSession->clientFromSession($request);
                try {
                    $client->ping($connection['tokens']);
                } catch (EnpsWebException $exception) {
                    if ($exception->kind !== 'expired') throw $exception;
                    $enpsSession->clearSession($request);
                    $client = new EnpsWebClient;
                    $connection = $client->connect();
                }
            }

            $stage = 'source';
            $refreshed = [];
            foreach ($selectedItems as $item) {
                try {
                    $content = $client->basicContent($connection['tokens'], $item->source_database, $item->source_path, $item->source_guid);
                } catch (EnpsWebException $exception) {
                    if ($exception->kind !== 'expired') throw $exception;
                    $enpsSession->clearSession($request);
                    $client = new EnpsWebClient;
                    $connection = $client->connect();
                    $content = $client->basicContent($connection['tokens'], $item->source_database, $item->source_path, $item->source_guid);
                }
                $refreshed[] = [$item, $content, EnpsBasicContent::mosObjects($content)];
            }

            $connection['cookies'] = $client->cookies();
            $connection['verifiedAt'] = now()->toIso8601String();
            $enpsSession->storeSession($request, $connection);

            $mosObjects = [];
            foreach ($refreshed as [, , $objects]) {
                foreach ($objects as $object) $mosObjects[json_encode($object, JSON_THROW_ON_ERROR)] = $object;
            }
            $stage = 'persistence';
            DB::transaction(function () use ($refreshed, $article, $mosObjects) {
                foreach ($refreshed as [$item, $content, $objects]) {
                    $stored = $item->basic_content ?: [];
                    $incomingCommands = collect($content['ObjectProperties'] ?? [])->first(fn ($property) => is_array($property)
                        && mb_strtolower((string) ($property['FieldName'] ?? '')) === 'textcommands');
                    $properties = $stored['ObjectProperties'] ?? [];
                    $commandIndex = null;
                    foreach ($properties as $index => $property) {
                        if (is_array($property) && mb_strtolower((string) ($property['FieldName'] ?? '')) === 'textcommands') {
                            $commandIndex = $index;
                            break;
                        }
                    }
                    if ($commandIndex === null) {
                        if (is_array($incomingCommands)) $properties[] = $incomingCommands;
                    } else {
                        $properties[$commandIndex]['FieldValue'] = is_array($incomingCommands['FieldValue'] ?? null) ? $incomingCommands['FieldValue'] : [];
                    }
                    $stored['ObjectProperties'] = $properties;
                    $item->update(['basic_content' => $stored, 'mos_objects' => $objects]);
                }
                $article->update(['mos_objects' => array_values($mosObjects)]);
            });

            return response()->json(['data' => ArticleResource::make($article->fresh()->load('image.tags'))->resolve($request)]);
        } catch (EnpsWebException $exception) {
            if ($exception->kind === 'expired') $enpsSession->clearSession($request);
            return response()->json(['message' => $exception->getMessage()], $exception->status);
        } catch (Throwable $exception) {
            Log::warning('Refresh MOS ENPS eșuat.', ['playlist_id' => $playlist->id, 'article_id' => $article->id, 'stage' => $stage, 'exception_type' => get_class($exception)]);
            return response()->json(['message' => 'Elementele MOS nu au putut fi actualizate. Datele existente au fost păstrate; încearcă din nou.'], 503);
        }
    }

    private function enpsItemsForArticle(Article $target, $articles, $items, array $snapshot): array
    {
        $excluded = app(PlaylistTitleExclusions::class)->terms();
        $itemQueues = [];
        foreach ($items as $item) {
            $identity = json_encode([$item->source_database, $item->source_path, $item->source_guid, $item->slug], JSON_THROW_ON_ERROR);
            $itemQueues[$identity][] = $item;
        }

        $sourceScripts = array_values(array_filter($snapshot['CollectionScripts'] ?? [], 'is_array'));
        foreach ($sourceScripts as $index => &$script) $script['_PlasmaSnapshotIndex'] = $index;
        unset($script);
        usort($sourceScripts, fn ($left, $right) => ((int) ($left['ScriptOrder'] ?? 0) <=> (int) ($right['ScriptOrder'] ?? 0))
            ?: ($left['_PlasmaSnapshotIndex'] <=> $right['_PlasmaSnapshotIndex']));

        $stories = [];
        foreach ($sourceScripts as $script) {
            $slug = trim((string) ($script['RecordPointer']['ListData']['Title'] ?? ''));
            if ($slug === '') continue;
            $name = preg_replace('/-(?:INTRO|INTO|BETA|OFF|LIVE|SNC|SINCRON|AMB|TEASE|FAKE|TEXT)(?:[ -]+(?:INTRO|INTO|BETA|OFF|LIVE|SNC|SINCRON|AMB|TEASE|FAKE|TEXT))*\s*$/iu', '', $slug) ?? '';
            $name = trim($name);
            if ($name === '') continue;
            $last = array_key_last($stories);
            if ($last === null || mb_strtoupper($stories[$last]['name']) !== mb_strtoupper($name)) {
                $stories[] = ['name' => $name, 'slugs' => [], 'entries' => []];
                $last = array_key_last($stories);
            }
            $entry = ['slug' => $slug, 'item' => null];
            $source = $script['_PlasmaSource'] ?? null;
            if (is_array($source)) {
                $identity = json_encode([$source['database'] ?? null, $source['path'] ?? null, $source['guid'] ?? null, $slug], JSON_THROW_ON_ERROR);
                if (($itemQueues[$identity] ?? []) !== []) {
                    $queue = $itemQueues[$identity];
                    $entry['item'] = array_shift($queue);
                    $itemQueues[$identity] = $queue;
                }
            }
            $stories[$last]['slugs'][] = $slug;
            $stories[$last]['entries'][] = $entry;
        }

        // Exclusions are applied only after reconstructing the complete ordered stories
        // from the private snapshot, which includes INTRO rows absent from enpsItems.
        $stories = array_values(array_filter($stories, fn ($story) => ! collect($excluded)
            ->contains(fn ($term) => str_contains(mb_strtoupper($story['name']), $term))));
        $targetSlugs = array_values(array_filter(explode('||', $target->slugs ?? '')));
        $matchingStories = array_values(array_filter($stories, fn ($story) => mb_strtoupper($story['name']) === mb_strtoupper((string) $target->technical_title)
            && $this->isOrderedSlugSubset($targetSlugs, $story['slugs'])));
        $matchingArticles = $articles->filter(fn ($candidate) => mb_strtoupper((string) $candidate->technical_title) === mb_strtoupper((string) $target->technical_title)
            && array_values(array_filter(explode('||', $candidate->slugs ?? ''))) === $targetSlugs)->values();
        $occurrence = $matchingArticles->search(fn ($candidate) => $candidate->id === $target->id);
        if ($occurrence === false) return ['items' => collect(), 'ambiguous' => false];
        if (count($matchingStories) !== $matchingArticles->count()) return ['items' => collect(), 'ambiguous' => true];

        $matchedItems = collect();
        $expectedIndex = 0;
        foreach ($matchingStories[$occurrence]['entries'] as $entry) {
            if (($targetSlugs[$expectedIndex] ?? null) !== $entry['slug']) continue;
            $expectedIndex++;
            if ($entry['item'] instanceof \App\Models\PlaylistEnpsItem) $matchedItems->push($entry['item']);
            if ($expectedIndex === count($targetSlugs)) break;
        }
        return ['items' => $matchedItems, 'ambiguous' => false];
    }

    private function isOrderedSlugSubset(array $expected, array $actual): bool
    {
        if ($expected === []) return false;
        $cursor = 0;
        foreach ($actual as $slug) {
            if (($expected[$cursor] ?? null) !== $slug) continue;
            $cursor++;
            if ($cursor === count($expected)) return true;
        }
        return false;
    }

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

        $previous_articles = app(PlaylistImporter::class)->previousArticles();

        $content = $request->validated('file')->getContent();
        $articles = ArticlesService::generate($content);
        $sourcePath = $sourceStorage->store($file, $content);

        try {
            $playlist = DB::transaction(function () use ($file, $articles, $previous_articles, $imageMatcher, $sourcePath) {
                $playlist = Playlist::create([
                    'title' => today()->format('d m Y').' '.Str::of($file->getClientOriginalName())->before('.HTM')->toString(),
                    'source_htm_path' => $sourcePath,
                ]);
                app(PlaylistImporter::class)->synchronizeArticles($playlist, $articles, $previous_articles, $imageMatcher);

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
        Request $request,
        Playlist $playlist,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
        EnpsWebSession $enpsSession,
    ) {
        if ($playlist->source_type === 'enps') {
            return $this->refreshEnpsPlaylist($request, $playlist, $imageMatcher, $sourceStorage, $enpsSession);
        }

        if (! $sourceStorage->exists($playlist)) {
            return back()->withErrors([
                'playlist' => 'Sursa HTM salvată nu mai este disponibilă pentru acest playlist.',
            ]);
        }

        $articles = ArticlesService::generate($sourceStorage->contents($playlist));
        $existingArticles = $playlist->articles()->get();

        DB::transaction(function () use ($playlist, $articles, $existingArticles, $imageMatcher) {
            app(PlaylistImporter::class)->synchronizeArticles(
                $playlist,
                $articles,
                $existingArticles,
                $imageMatcher,
                removeMissing: true,
            );
        });

        return redirect()->route('playlists.show', $playlist)->with('status', 'playlist-refreshed');
    }

    private function refreshEnpsPlaylist(
        Request $request,
        Playlist $playlist,
        ImageMatcher $imageMatcher,
        PlaylistSourceStorage $sourceStorage,
        EnpsWebSession $enpsSession,
    ) {
        if (blank($playlist->source_enps_database) || blank($playlist->source_enps_path) || blank($playlist->source_enps_guid)) {
            return back()->withErrors(['playlist' => 'Identificatorii sursei ENPS lipsesc pentru acest playlist.']);
        }

        $connection = $enpsSession->connectionFromSession($request);
        $stage = 'connection';
        try {
            if ($connection === null || blank($connection['tokens']['nom'] ?? null)) {
                $client = new EnpsWebClient;
                $connection = $client->connect();
            } else {
                $client = $enpsSession->clientFromSession($request);
                try {
                    $client->ping($connection['tokens']);
                } catch (EnpsWebException $exception) {
                    if ($exception->kind !== 'expired') {
                        throw $exception;
                    }

                    $enpsSession->clearSession($request);
                    $client = new EnpsWebClient;
                    $connection = $client->connect();
                }
            }
            $stage = 'source';
            try {
                $payload = $client->rundownWithBasicContent($connection['tokens'], $playlist->source_enps_database, [
                    'path' => $playlist->source_enps_path,
                    'guid' => $playlist->source_enps_guid,
                ]);
            } catch (EnpsWebException $exception) {
                if ($exception->kind !== 'expired') {
                    throw $exception;
                }

                $enpsSession->clearSession($request);
                $client = new EnpsWebClient;
                $connection = $client->connect();
                $payload = $client->rundownWithBasicContent($connection['tokens'], $playlist->source_enps_database, [
                    'path' => $playlist->source_enps_path,
                    'guid' => $playlist->source_enps_guid,
                ]);
            }
            $connection['cookies'] = $client->cookies();
            $connection['verifiedAt'] = now()->toIso8601String();
            $enpsSession->storeSession($request, $connection);

            // Parse and validate the complete response before staging or changing persisted data.
            $stage = 'parsing';
            $articles = app(EnpsPlaylistAdapter::class)->articles($payload);
            $stage = 'snapshot';
            $newSnapshotPath = $sourceStorage->storeEnpsSnapshot($payload);
            $previousSnapshotPath = $playlist->source_enps_snapshot_path;
            $existingArticles = $playlist->articles()->get();

            $stage = 'persistence';
            try {
                DB::transaction(function () use ($playlist, $articles, $existingArticles, $imageMatcher, $newSnapshotPath, $payload) {
                    app(PlaylistImporter::class)->synchronizeArticles(
                        $playlist,
                        $articles,
                        $existingArticles,
                        $imageMatcher,
                        removeMissing: true,
                    );
                    app(EnpsPlaylistItems::class)->synchronize($playlist, $payload);
                    $playlist->update(['source_enps_snapshot_path' => $newSnapshotPath]);
                });
            } catch (Throwable $exception) {
                $sourceStorage->deletePath($newSnapshotPath);
                throw $exception;
            }

            if ($previousSnapshotPath && $previousSnapshotPath !== $newSnapshotPath) {
                $sourceStorage->deletePath($previousSnapshotPath);
            }
        } catch (EnpsWebException $exception) {
            if ($exception->kind === 'expired') {
                $enpsSession->clearSession($request);
            }

            return back()->withErrors(['playlist' => $exception->getMessage()]);
        } catch (Throwable $exception) {
            Log::warning('Refresh ENPS eșuat.', [
                'playlist_id' => $playlist->id,
                'stage' => $stage,
                'exception_type' => get_class($exception),
            ]);

            return back()->withErrors(['playlist' => 'Playlistul nu a putut fi actualizat. Datele existente au fost păstrate; încearcă din nou.']);
        }

        return redirect()->route('playlists.show', $playlist)->with('status', 'playlist-refreshed');
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
                'source_type' => $playlist->source_type,
                'can_refresh_parsing' => $playlist->source_type === 'enps'
                    ? filled($playlist->source_enps_database) && filled($playlist->source_enps_path) && filled($playlist->source_enps_guid)
                    : $sourceStorage->exists($playlist),
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
