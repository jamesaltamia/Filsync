<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('canteen_tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Juan Dela Cruz"
            $table->string('contact_number')->nullable();
            
            // Link to the stalls table
            // onDelete('cascade') means if a stall is deleted, the tenant record is removed (optional, but cleaner)
            $table->foreignId('stall_id')
                  ->constrained('canteen_stalls')
                  ->onDelete('cascade');
                  
            $table->date('contract_start');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('canteen_tenants');
    }
};