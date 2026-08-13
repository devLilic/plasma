<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->timestamp('last_used_at')->nullable()->after('isNew')->index();
        });

        DB::table('images')->whereNull('last_used_at')->update([
            'last_used_at' => DB::raw('updated_at'),
        ]);
    }

    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropIndex(['last_used_at']);
            $table->dropColumn('last_used_at');
        });
    }
};
