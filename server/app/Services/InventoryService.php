<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function getLowStockProducts()
    {
        return Product::whereColumn('stock', '<=', 'low_stock_threshold')
            ->where('is_active', true)
            ->with('category')
            ->get();
    }

    public function updateStock(int $productId, int $quantity, string $type = 'add')
    {
        $product = Product::findOrFail($productId);

        if ($type === 'add') {
            $product->stock += $quantity;
        } elseif ($type === 'subtract') {
            $product->stock = max(0, $product->stock - $quantity);
        } else {
            $product->stock = $quantity;
        }

        $product->save();
        return $product;
    }
}

