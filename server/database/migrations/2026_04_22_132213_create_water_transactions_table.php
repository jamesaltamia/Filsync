<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('water_transactions', function (Blueprint $table) {
            $table->id();

            $table->decimal('container_size', 8, 2); // 3.78 liters
            $table->integer('quantity'); // 5 containers

            $table->decimal('total_gallons', 10, 2); // gallon equivalent sold

            $table->decimal('unit_price', 10, 2); // 25
            $table->decimal('total_price', 10, 2); // 125

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('water_transactions');
    }
};