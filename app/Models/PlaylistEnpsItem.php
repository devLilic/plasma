<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlaylistEnpsItem extends Model
{
    protected $fillable = ['position', 'script_order', 'source_database', 'source_path', 'source_guid', 'slug', 'basic_content', 'mos_objects'];

    protected $hidden = ['basic_content', 'mos_objects', 'source_database', 'source_path', 'source_guid'];

    protected $casts = ['basic_content' => 'array', 'mos_objects' => 'array'];

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }
}
