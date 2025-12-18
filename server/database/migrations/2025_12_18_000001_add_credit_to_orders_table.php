<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Extend payment_method enum to support 'credit'
        // NOTE: this uses a raw statement because the original column is enum.
        DB::statement("ALTER TABLE orders MODIFY payment_method ENUM('cash','credit') NOT NULL DEFAULT 'cash'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to only 'cash'
        DB::statement("ALTER TABLE orders MODIFY payment_method ENUM('cash') NOT NULL DEFAULT 'cash'");
    }
};


