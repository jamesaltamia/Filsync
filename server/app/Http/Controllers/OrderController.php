<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'items.product']);

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Search by order number
        if ($request->has('search')) {
            $query->where('order_number', 'like', "%{$request->search}%");
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($orders);
    }

    public function show(string $id)
    {
        $order = Order::with(['customer', 'items.product.category'])->findOrFail($id);
        return response()->json($order);
    }

    /**
     * Mark a credit order as paid.
     */
    public function markAsPaid(string $id)
    {
        $order = Order::where('id', $id)
            ->where('payment_method', 'credit')
            ->firstOrFail();

        // Only update if not already completed
        if ($order->status !== 'completed') {
            $order->status = 'completed';
            $order->save();
        }

        return response()->json([
            'message' => 'Order marked as paid successfully.',
            'order' => $order->fresh(),
        ]);
    }
}
