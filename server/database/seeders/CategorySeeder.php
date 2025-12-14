<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Uniforms', 'description' => 'School uniforms and clothing'],
            ['name' => 'Accessories', 'description' => 'School accessories and supplies'],
            ['name' => 'Merch', 'description' => 'School merchandise'],
            ['name' => 'Books', 'description' => 'Textbooks and educational materials'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
