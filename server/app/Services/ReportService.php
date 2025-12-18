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

        return Order::whereDate('created_at', $date)
            ->select(
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(tax_amount) as total_tax')
            )
            ->first();
    }

    public function getMonthlySales($year = null, $month = null)
    {
        $year = $year ?? Carbon::now()->year;
        $month = $month ?? Carbon::now()->month;

        return Order::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->select(
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(tax_amount) as total_tax')
            )
            ->first();
    }

    public function getYearlySales($year = null)
    {
        $year = $year ?? Carbon::now()->year;

        return Order::whereYear('created_at', $year)
            ->select(
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(tax_amount) as total_tax')
            )
            ->first();
    }

    public function getItemSales($startDate = null, $endDate = null)
    {
        $query = OrderItem::with(['product.category'])
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            // Include both completed and pending (credit) orders; exclude only cancelled
            ->where('orders.status', '!=', 'cancelled');

        if ($startDate) {
            $query->whereDate('orders.created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('orders.created_at', '<=', $endDate);
        }

        return $query->select(
            'order_items.product_id',
            DB::raw('SUM(order_items.quantity) as total_quantity'),
            DB::raw('SUM(order_items.subtotal) as total_revenue')
        )
            ->groupBy('order_items.product_id')
            ->get()
            ->map(function ($item) {
                return [
                    'product' => $item->product,
                    'total_quantity' => $item->total_quantity,
                    'total_revenue' => $item->total_revenue,
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

