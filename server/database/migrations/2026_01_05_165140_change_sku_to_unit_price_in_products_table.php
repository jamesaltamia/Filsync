<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop the unique constraint on sku first
            $table->dropUnique(['sku']);
            // Drop the sku column
            $table->dropColumn('sku');
            // Add unit_price column
            $table->decimal('unit_price', 10, 2)->nullable()->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop unit_price
            $table->dropColumn('unit_price');
            // Add back sku
            $table->string('sku')->unique()->nullable()->after('price');
        });
    }
};
