<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_room_product_id')->constrained('stock_room_products')->onDelete('cascade');
            $table->enum('type', ['add', 'subtract', 'set']);
            $table->integer('quantity');           // amount adjusted
            $table->integer('quantity_before');    // snapshot before
            $table->integer('quantity_after');     // snapshot after
            $table->string('adjusted_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
