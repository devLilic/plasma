<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('technical_title')->nullable()->after('subtitle');
            $table->json('article_types')->nullable()->after('article_type');
            $table->json('content_sections')->nullable()->after('intro');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['technical_title', 'article_types', 'content_sections']);
        });
    }
};
