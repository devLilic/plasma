<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlaylistMosOverride extends Model
{
    protected $fillable = [
        'playlist_id',
        'object_key',
        'field_key',
        'field_name',
        'override_value',
        'source_fingerprint',
    ];

    protected $hidden = ['source_fingerprint'];

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }
}
