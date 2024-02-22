<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Image extends Model {

    use HasFactory;

    protected $fillable = ['sourceUrl', 'url', 'isNew'];

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }
}
