<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('playlist_mos_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('playlist_id')->constrained()->cascadeOnDelete();
            $table->char('object_key', 66);
            $table->char('field_key', 66);
            $table->string('field_name', 200);
            $table->longText('override_value');
            $table->char('source_fingerprint', 64);
            $table->timestamps();
            $table->unique(['playlist_id', 'field_key']);
            $table->index(['playlist_id', 'object_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('playlist_mos_overrides');
    }
};
