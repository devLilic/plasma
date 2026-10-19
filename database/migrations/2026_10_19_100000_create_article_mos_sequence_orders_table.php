<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_mos_sequence_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('entry_order');
            $table->json('entry_zones');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_mos_sequence_orders');
    }
};
