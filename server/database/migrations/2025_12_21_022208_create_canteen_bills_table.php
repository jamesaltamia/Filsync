<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('canteen_bills', function (Blueprint $table) {
            $table->id();
            
            // Link to the tenants table
            $table->foreignId('tenant_id')
                  ->constrained('canteen_tenants')
                  ->onDelete('cascade');
            
            $table->string('month_year'); // e.g., "January 2025" - Simple string for easy display
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['unpaid', 'paid'])->default('unpaid');
            $table->timestamp('paid_at')->nullable(); // Stores the exact time they paid
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('canteen_bills');
    }
};