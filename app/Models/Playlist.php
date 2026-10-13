<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Playlist extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'source_htm_path', 'source_type', 'source_enps_database', 'source_enps_path', 'source_enps_guid', 'source_enps_work_at', 'source_enps_snapshot_path', 'source_import_key'];

    protected $hidden = ['source_htm_path', 'source_enps_database', 'source_enps_path', 'source_enps_guid', 'source_enps_snapshot_path', 'source_import_key'];

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function enpsItems(): HasMany
    {
        return $this->hasMany(PlaylistEnpsItem::class)->orderBy('position');
    }
}
