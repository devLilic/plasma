<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('playlist_enps_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('playlist_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->integer('script_order')->nullable();
            $table->string('source_database', 200);
            $table->string('source_path', 200);
            $table->string('source_guid', 200);
            $table->text('slug')->nullable();
            // TextCommands can include large embedded MOS thumbnails.
            $table->longText('basic_content');
            $table->json('mos_objects');
            $table->timestamps();
            $table->unique(['playlist_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('playlist_enps_items');
    }
};
