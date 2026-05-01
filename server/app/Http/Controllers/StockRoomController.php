<?php

namespace App\Http\Controllers;

use App\Models\StockRoomProduct;
use App\Models\StockTransfer;
use App\Models\StockAdjustment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockRoomController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  LIST                                                                */
    /* ------------------------------------------------------------------ */
    public function index(Request $request)
    {
        $query = StockRoomProduct::with('category');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('sku', 'like', "%{$s}%")
                  ->orWhere('supplier', 'like', "%{$s}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'low_stock') {
                $query->where('quantity', '>', 0)
                      ->whereColumn('quantity', '<=', 'low_stock_threshold')
                      ->where('status', 'available');
            } elseif ($status === 'out_of_stock') {
                $query->where('quantity', '<=', 0);
            } else {
                $query->where('status', $status);
            }
        }

        $sortField = $request->get('sort', 'created_at');
        $sortDir   = $request->get('dir', 'desc');
        $allowedSorts = ['created_at', 'quantity', 'name', 'selling_price'];
        if (!in_array($sortField, $allowedSorts)) $sortField = 'created_at';

        $products = $query->orderBy($sortField, $sortDir)->paginate(20);

        // Append computed_status to each item
        $products->getCollection()->transform(function ($item) {
            $item->computed_status = $item->computed_status;
            return $item;
        });

        return response()->json($products);
    }

    /* ------------------------------------------------------------------ */
    /*  SUMMARY STATS                                                       */
    /* ------------------------------------------------------------------ */
    public function stats()
    {
        $total      = StockRoomProduct::count();
        $lowStock   = StockRoomProduct::where('status', 'available')
                        ->where('quantity', '>', 0)
                        ->whereColumn('quantity', '<=', 'low_stock_threshold')
                        ->count();
        $outOfStock = StockRoomProduct::where('quantity', '<=', 0)->count();
        $reserved   = StockRoomProduct::where('status', 'reserved')->count();
        $damaged    = StockRoomProduct::where('status', 'damaged')->count();
        $totalValue = StockRoomProduct::selectRaw('SUM(cost_price * quantity) as val')->value('val') ?? 0;
        $recentTransfers = StockTransfer::with(['stockRoomProduct', 'inventoryProduct'])
                            ->latest()->limit(5)->get();

        return response()->json(compact('total', 'lowStock', 'outOfStock', 'reserved', 'damaged', 'totalValue', 'recentTransfers'));
    }

    /* ------------------------------------------------------------------ */
    /*  CREATE                                                              */
    /* ------------------------------------------------------------------ */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'sku'                => 'nullable|string|unique:stock_room_products,sku',
            'description'        => 'nullable|string',
            'category_id'        => 'required|exists:categories,id',
            'supplier'           => 'nullable|string|max:255',
            'cost_price'         => 'nullable|numeric|min:0',
            'selling_price'      => 'nullable|numeric|min:0',
            'quantity'           => 'required|integer|min:0',
            'low_stock_threshold'=> 'nullable|integer|min:0',
            'status'             => 'nullable|in:available,reserved,damaged,hold',
            'added_by'           => 'nullable|string|max:255',
            'notes'              => 'nullable|string',
        ]);

        $product = StockRoomProduct::create($validated);
        $product->computed_status = $product->computed_status;

        return response()->json($product->load('category'), 201);
    }

    /* ------------------------------------------------------------------ */
    /*  UPDATE                                                              */
    /* ------------------------------------------------------------------ */
    public function update(Request $request, $id)
    {
        $product = StockRoomProduct::findOrFail($id);

        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'sku'                => 'nullable|string|unique:stock_room_products,sku,' . $id,
            'description'        => 'nullable|string',
            'category_id'        => 'required|exists:categories,id',
            'supplier'           => 'nullable|string|max:255',
            'cost_price'         => 'nullable|numeric|min:0',
            'selling_price'      => 'nullable|numeric|min:0',
            'quantity'           => 'nullable|integer|min:0',
            'low_stock_threshold'=> 'nullable|integer|min:0',
            'status'             => 'nullable|in:available,reserved,damaged,hold',
            'added_by'           => 'nullable|string|max:255',
            'notes'              => 'nullable|string',
        ]);

        $product->update($validated);
        $product->computed_status = $product->computed_status;

        return response()->json($product->load('category'));
    }

    /* ------------------------------------------------------------------ */
    /*  DELETE                                                              */
    /* ------------------------------------------------------------------ */
    public function destroy($id)
    {
        $product = StockRoomProduct::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    /* ------------------------------------------------------------------ */
    /*  ADJUST QUANTITY                                                     */
    /* ------------------------------------------------------------------ */
    public function adjust(Request $request, $id)
    {
        $product = StockRoomProduct::findOrFail($id);
        $request->validate([
            'type'        => 'required|in:add,subtract,set',
            'quantity'    => 'required|integer|min:0',
            'adjusted_by' => 'nullable|string|max:255',
            'notes'       => 'nullable|string',
        ]);

        $qty = (int) $request->quantity;
        $qtyBefore = $product->quantity;

        if ($request->type === 'add') {
            $product->quantity += $qty;
        } elseif ($request->type === 'subtract') {
            $product->quantity = max(0, $product->quantity - $qty);
        } else {
            $product->quantity = $qty;
        }

        $qtyAfter = $product->quantity;
        $product->save();
        $product->computed_status = $product->computed_status;

        StockAdjustment::create([
            'stock_room_product_id' => $product->id,
            'type'                  => $request->type,
            'quantity'              => $qty,
            'quantity_before'       => $qtyBefore,
            'quantity_after'        => $qtyAfter,
            'adjusted_by'           => $request->adjusted_by,
            'notes'                 => $request->notes,
        ]);

        return response()->json($product->load('category'));
    }

    /* ------------------------------------------------------------------ */
    /*  UPDATE STATUS                                                       */
    /* ------------------------------------------------------------------ */
    public function updateStatus(Request $request, $id)
    {
        $product = StockRoomProduct::findOrFail($id);
        $request->validate(['status' => 'required|in:available,reserved,damaged,hold']);
        $product->update(['status' => $request->status]);
        $product->computed_status = $product->computed_status;
        return response()->json($product->load('category'));
    }

    /* ------------------------------------------------------------------ */
    /*  TRANSFER TO SELLING INVENTORY                                       */
    /* ------------------------------------------------------------------ */
    public function transfer(Request $request, $id)
    {
        $stockItem = StockRoomProduct::findOrFail($id);

        $request->validate([
            'quantity'            => 'required|integer|min:1|max:' . $stockItem->quantity,
            'inventory_product_id'=> 'nullable|exists:products,id',
            'transferred_by'      => 'nullable|string|max:255',
            'notes'               => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $stockItem) {
            $qty = (int) $request->quantity;

            // Deduct from stock room
            $stockItem->quantity -= $qty;
            $stockItem->save();

            // Add to selling inventory if a product is specified
            if ($request->filled('inventory_product_id')) {
                $invProduct = Product::findOrFail($request->inventory_product_id);
                $invProduct->stock += $qty;
                // Re-enable if was disabled
                if (!$invProduct->is_active && $invProduct->stock > 0) {
                    $invProduct->is_active = true;
                }
                $invProduct->save();
            }

            // Log transfer
            StockTransfer::create([
                'stock_room_product_id' => $stockItem->id,
                'inventory_product_id'  => $request->inventory_product_id,
                'quantity'              => $qty,
                'transferred_by'        => $request->transferred_by,
                'notes'                 => $request->notes,
            ]);
        });

        $stockItem->refresh();
        $stockItem->computed_status = $stockItem->computed_status;

        return response()->json([
            'message'    => 'Transfer successful',
            'stock_item' => $stockItem->load('category'),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  TRANSFER HISTORY                                                    */
    /* ------------------------------------------------------------------ */
    public function transferHistory($id)
    {
        $history = StockTransfer::with(['inventoryProduct'])
            ->where('stock_room_product_id', $id)
            ->latest()
            ->get();

        return response()->json($history);
    }

    /* ------------------------------------------------------------------ */
    /*  ADJUSTMENT HISTORY                                                  */
    /* ------------------------------------------------------------------ */
    public function adjustHistory($id)
    {
        $history = StockAdjustment::where('stock_room_product_id', $id)
            ->latest()
            ->get();

        return response()->json($history);
    }
}
