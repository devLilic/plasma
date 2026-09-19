<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'technical_title',
        'slugs',
        'intro',
        'content_sections',
        'article_type',
        'article_types',
        'playlist_id',
        'playlist_order',
        'image_id',
    ];

    protected $casts = [
        'article_types' => 'array',
        'content_sections' => 'array',
    ];

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }

    public function image()
    {
        return $this->belongsTo(Image::class);
    }
}
