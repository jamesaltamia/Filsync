<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request)
    {
        $query = Product::with('category');

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Filter active/inactive
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($products);
    }

    public function store(Request $request)
    {
        // Convert is_active string to boolean before validation
        if ($request->has('is_active')) {
            $request->merge(['is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'size' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'sku' => 'nullable|string|unique:products,sku',
            'barcode' => 'nullable|string|unique:products,barcode',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $imagePath;
        }

        $product = Product::create($validated);
        return response()->json($product->load('category'), 201);
    }

    public function show(string $id)
    {
        $product = Product::with('category')->findOrFail($id);
        return response()->json($product);
    }

    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        // Convert is_active string to boolean before validation
        if ($request->has('is_active')) {
            $request->merge(['is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $product->is_active]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'size' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'sku' => 'nullable|string|unique:products,sku,' . $id,
            'barcode' => 'nullable|string|unique:products,barcode,' . $id,
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image && file_exists(public_path($product->image))) {
                unlink(public_path($product->image));
            }
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $imagePath;
        }

        $product->update($validated);
        return response()->json($product->load('category'));
    }

    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function lowStock()
    {
        $products = $this->inventoryService->getLowStockProducts();
        return response()->json($products);
    }
}
