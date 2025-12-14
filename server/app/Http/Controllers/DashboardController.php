<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        $today = Carbon::today();

        // Today's sales
        $todaySales = Order::whereDate('created_at', $today)
            ->select(
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('COALESCE(SUM(total), 0) as total_revenue')
            )
            ->first();

        // Low stock alerts
        $lowStockProducts = $this->inventoryService->getLowStockProducts();

        // Recent orders
        $recentOrders = Order::with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'today_sales' => [
                'total_orders' => $todaySales->total_orders ?? 0,
                'total_revenue' => floatval($todaySales->total_revenue ?? 0),
            ],
            'low_stock_alerts' => $lowStockProducts,
            'recent_orders' => $recentOrders,
        ]);
    }
}
