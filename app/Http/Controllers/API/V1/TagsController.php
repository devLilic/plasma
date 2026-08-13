<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\Request;

class TagsController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:80'],
        ]);

        $query = trim($validated['query'] ?? '');

        return TagResource::collection(
            Tag::query()
                ->when($query !== '', fn ($builder) => $builder->where('title', 'like', '%'.$query.'%'))
                ->orderBy('title')
                ->limit(10)
                ->get()
        );
    }
}
