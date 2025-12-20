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
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'year_level')) {
                $table->string('year_level')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('customers', 'department')) {
                $table->string('department')->nullable()->after('year_level');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (Schema::hasColumn('customers', 'year_level')) {
                $table->dropColumn('year_level');
            }
            if (Schema::hasColumn('customers', 'department')) {
                $table->dropColumn('department');
            }
        });
    }
};
