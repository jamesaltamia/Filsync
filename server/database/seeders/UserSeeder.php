<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@filsync.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // Create Cashier User
        User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@filsync.com',
            'password' => Hash::make('cashier123'),
            'role' => 'cashier',
        ]);
    }
}
