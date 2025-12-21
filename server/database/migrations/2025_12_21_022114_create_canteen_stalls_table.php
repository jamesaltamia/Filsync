<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('canteen_stalls', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Stall 01"
            $table->string('location')->default('Main Canteen');
            $table->decimal('monthly_rent', 10, 2); // e.g., 5000.00
            $table->enum('status', ['available', 'occupied'])->default('available');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('canteen_stalls');
    }
};