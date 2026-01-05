<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportService
{
    public function getDailySales($date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();

        $orderStats = Order::whereDate('created_at', $date)
            ->select(
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('SUM(orders.total) as total_revenue'),
                DB::raw('SUM(orders.subtotal) as total_subtotal'),
                DB::raw('SUM(orders.tax_amount) as total_tax')
            )
            ->first();

        // Calculate total items sold
        $totalItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereDate('orders.created_at', $date)
            ->where('orders.status', '!=', 'cancelled')
            ->sum('order_items.quantity');

        // Calculate Total Unit Cost (unit_price * quantity for all sold items)
        $totalUnitCost = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereDate('orders.created_at', $date)
            ->where('orders.status', '!=', 'cancelled')
            ->whereNotNull('products.unit_price')
            ->sum(DB::raw('order_items.quantity * products.unit_price'));

        return (object) [
            'total_orders' => $orderStats->total_orders ?? 0,
            'total_revenue' => $orderStats->total_revenue ?? 0,
            'total_subtotal' => $orderStats->total_subtotal ?? 0,
            'total_unit_cost' => (float) $totalUnitCost,
            'total_tax' => $orderStats->total_tax ?? 0,
            'total_items' => (int) $totalItems,
        ];
    }

    public function getMonthlySales($year = null, $month = null)
    {
        $year = $year ?? Carbon::now()->year;
        $month = $month ?? Carbon::now()->month;

        $orderStats = Order::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->select(
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('SUM(orders.total) as total_revenue'),
                DB::raw('SUM(orders.subtotal) as total_subtotal'),
                DB::raw('SUM(orders.tax_amount) as total_tax')
            )
            ->first();

        // Calculate total items sold
        $totalItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereYear('orders.created_at', $year)
            ->whereMonth('orders.created_at', $month)
            ->where('orders.status', '!=', 'cancelled')
            ->sum('order_items.quantity');

        // Calculate Total Unit Cost
        $totalUnitCost = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereYear('orders.created_at', $year)
            ->whereMonth('orders.created_at', $month)
            ->where('orders.status', '!=', 'cancelled')
            ->whereNotNull('products.unit_price')
            ->sum(DB::raw('order_items.quantity * products.unit_price'));

        return (object) [
            'total_orders' => $orderStats->total_orders ?? 0,
            'total_revenue' => $orderStats->total_revenue ?? 0,
            'total_subtotal' => $orderStats->total_subtotal ?? 0,
            'total_unit_cost' => (float) $totalUnitCost,
            'total_tax' => $orderStats->total_tax ?? 0,
            'total_items' => (int) $totalItems,
        ];
    }

    public function getYearlySales($year = null)
    {
        $year = $year ?? Carbon::now()->year;

        $orderStats = Order::whereYear('created_at', $year)
            ->select(
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('SUM(orders.total) as total_revenue'),
                DB::raw('SUM(orders.subtotal) as total_subtotal'),
                DB::raw('SUM(orders.tax_amount) as total_tax')
            )
            ->first();

        // Calculate total items sold
        $totalItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereYear('orders.created_at', $year)
            ->where('orders.status', '!=', 'cancelled')
            ->sum('order_items.quantity');

        // Calculate Total Unit Cost
        $totalUnitCost = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereYear('orders.created_at', $year)
            ->where('orders.status', '!=', 'cancelled')
            ->whereNotNull('products.unit_price')
            ->sum(DB::raw('order_items.quantity * products.unit_price'));

        return (object) [
            'total_orders' => $orderStats->total_orders ?? 0,
            'total_revenue' => $orderStats->total_revenue ?? 0,
            'total_subtotal' => $orderStats->total_subtotal ?? 0,
            'total_unit_cost' => (float) $totalUnitCost,
            'total_tax' => $orderStats->total_tax ?? 0,
            'total_items' => (int) $totalItems,
        ];
    }

    public function getItemSales($startDate = null, $endDate = null, $categoryId = null)
    {
        $query = OrderItem::with(['product.category'])
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            // Include both completed and pending (credit) orders; exclude only cancelled
            ->where('orders.status', '!=', 'cancelled');

        // Filter by date
        if ($startDate) {
            $query->whereDate('orders.created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('orders.created_at', '<=', $endDate);
        }

        // Filter by category
        if ($categoryId) {
            $query->where('products.category_id', $categoryId);
        }

        return $query->select(
            'order_items.product_id',
            DB::raw('SUM(order_items.quantity) as total_quantity'),
            DB::raw('SUM(order_items.subtotal) as total_revenue'),
            DB::raw('SUM(order_items.quantity * COALESCE(products.unit_price, 0)) as total_unit_cost')
        )
            ->groupBy('order_items.product_id')
            ->get()
            ->map(function ($item) {
                return [
                    'product' => $item->product,
                    'total_quantity' => $item->total_quantity,
                    'total_revenue' => $item->total_revenue,
                    'total_unit_cost' => (float) ($item->total_unit_cost ?? 0),
                ];
            });
    }

    /**
     * Get credit sales for teachers (both paid and unpaid).
     */
    public function getCreditSales()
    {
        return Order::with('customer')
            ->where('payment_method', 'credit')
            ->whereHas('customer', function ($query) {
                $query->where('type', 'teacher');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $status = $order->status === 'completed' ? 'Paid' : 'Unpaid';

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'teacher_name' => $order->customer?->full_name ?? ($order->customer ? $order->customer->first_name . ' ' . $order->customer->last_name : 'N/A'),
                    'date' => $order->created_at->toDateTimeString(),
                    'total' => (float) $order->total,
                    'status' => $status,
                ];
            });
    }
}

