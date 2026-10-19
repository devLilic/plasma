<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleMosSequenceOrder extends Model
{
    protected $fillable = ['article_id', 'entry_order', 'entry_zones'];

    protected $casts = [
        'entry_order' => 'array',
        'entry_zones' => 'array',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
