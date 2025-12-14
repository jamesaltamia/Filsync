<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use Illuminate\Http\Request;

class StockController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
            'type' => 'required|in:add,subtract,set',
        ]);

        $product = $this->inventoryService->updateStock(
            $id,
            $validated['quantity'],
            $validated['type']
        );

        return response()->json($product->load('category'));
    }
}
