<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model {

    use HasFactory;

    protected $fillable = ['title', 'subtitle', 'slugs', 'intro', 'article_type', 'playlist_id', 'playlist_order', 'image_id'];

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }
}
