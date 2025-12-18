<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update payment_method enum to allow 'cash' and 'credit'
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
