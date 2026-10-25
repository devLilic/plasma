<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('playlists', function (Blueprint $table) {
            $table->string('source_type', 10)->default('htm');
            $table->string('source_enps_database', 200)->nullable();
            $table->string('source_enps_path', 200)->nullable();
            $table->string('source_enps_guid', 200)->nullable()->index();
            $table->string('source_enps_work_at', 50)->nullable();
            $table->string('source_enps_snapshot_path')->nullable();
            $table->string('source_import_key', 64)->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('playlists', function (Blueprint $table) {
            $table->dropUnique(['source_import_key']);
            $table->dropIndex(['source_enps_guid']);
            $table->dropColumn(['source_type', 'source_enps_database', 'source_enps_path', 'source_enps_guid', 'source_enps_work_at', 'source_enps_snapshot_path', 'source_import_key']);
        });
    }
};
