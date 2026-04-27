<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_room_product_id')->constrained('stock_room_products')->onDelete('cascade');
            $table->foreignId('inventory_product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->integer('quantity');
            $table->string('transferred_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
