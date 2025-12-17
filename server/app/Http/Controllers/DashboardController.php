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

        // Monthly revenue & cost (last 12 months)
        $monthlyData = $this->getMonthlyRevenueAndCost();

        // Sales by category
        $salesByCategory = $this->getSalesByCategory();

        // Customer type distribution for doughnut chart
        $customerTypeDistribution = $this->getCustomerTypeDistribution();

        return response()->json([
            'today_sales' => [
                'total_orders' => $todaySales->total_orders ?? 0,
                'total_revenue' => floatval($todaySales->total_revenue ?? 0),
            ],
            'low_stock_alerts' => $lowStockProducts,
            'recent_orders' => $recentOrders,
            'monthly_revenue_cost' => $monthlyData,
            'sales_by_category' => $salesByCategory,
            'customer_type_distribution' => $customerTypeDistribution,
        ]);
    }

    private function getMonthlyRevenueAndCost()
    {
        $data = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $startOfMonth = $month->copy()->startOfMonth();
            $endOfMonth = $month->copy()->endOfMonth();

            $revenue = Order::whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('total');

            // Calculate cost (sum of product price * quantity for all orders in that month)
            $cost = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereBetween('orders.created_at', [$startOfMonth, $endOfMonth])
                ->sum(DB::raw('order_items.quantity * (products.price * 0.6)')); // Assuming 60% cost

            $data[] = [
                'month' => $month->format('M'),
                'revenue' => floatval($revenue),
                'cost' => floatval($cost),
            ];
        }
        return $data;
    }

    private function getSalesByCategory()
    {
        return DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name as category', DB::raw('SUM(order_items.subtotal) as total'))
            ->groupBy('categories.id', 'categories.name')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total' => floatval($item->total),
                ];
            });
    }

    private function getCustomerTypeDistribution()
    {
        // Get order counts by customer type
        $students = Order::whereHas('customer', function ($query) {
            $query->where('type', 'student');
        })->count();

        $teachers = Order::whereHas('customer', function ($query) {
            $query->where('type', 'teacher');
        })->count();

        $walkIn = Order::whereNull('customer_id')->count();

        return [
            ['name' => 'Students', 'value' => $students],
            ['name' => 'Teachers', 'value' => $teachers],
            ['name' => 'Walk-in', 'value' => $walkIn],
        ];
    }
}
