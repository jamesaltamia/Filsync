<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\SalesService;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    protected $salesService;

    public function __construct(SalesService $salesService)
    {
        $this->salesService = $salesService;
    }

    public function index(Request $request)
    {
        $query = Product::with('category')->where('is_active', true);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('name')->get();
        return response()->json($products);
    }

    public function findByBarcode(Request $request)
    {
        $barcode = $request->input('barcode');
        
        if (!$barcode) {
            return response()->json(['error' => 'Barcode is required'], 400);
        }

        $product = Product::with('category')
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'payment_method' => 'nullable|in:cash,credit',
            'cash_tendered' => 'nullable|numeric|min:0',
            'change_due' => 'nullable|numeric',
        ]);

        try {
            $order = $this->salesService->createOrder($validated);
            return response()->json($order, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
