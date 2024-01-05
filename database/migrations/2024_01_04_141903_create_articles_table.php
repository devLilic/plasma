<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table)
        {
            $table->id();
            $table->string('title')->nullable();
            $table->string('subtitle');
            $table->string('slugs')->nullable();
            $table->text('intro')->nullable();
            $table->string('article_type'); // BETA | OFF
            $table->foreignId('playlist_id')->constrained()->onDelete('cascade');
            $table->integer('playlist_order')->default(1);
            $table->unsignedBigInteger('image_id')->nullable();
            $table->timestamps();

            $table->foreign('image_id')->references('id')->on('images');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
