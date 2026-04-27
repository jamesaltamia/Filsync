<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use App\Models\WaterTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function daily(Request $request)
    {
        $date = $request->get('date');
        $sales = $this->reportService->getDailySales($date);
        return response()->json($sales);
    }

    public function monthly(Request $request)
    {
        $year = $request->get('year');
        $month = $request->get('month');
        $sales = $this->reportService->getMonthlySales($year, $month);
        return response()->json($sales);
    }

    public function yearly(Request $request)
    {
        $year = $request->get('year');
        $sales = $this->reportService->getYearlySales($year);
        return response()->json($sales);
    }

    public function itemSales(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $categoryId = $request->get('category_id');
        $sales = $this->reportService->getItemSales($startDate, $endDate, $categoryId);
        return response()->json($sales);
    }

    public function creditSales()
    {
        $sales = $this->reportService->getCreditSales();
        return response()->json($sales);
    }

    public function waterSales(Request $request)
    {
        $type  = $request->get('type', 'daily');  // daily | monthly | yearly
        $year  = $request->get('year',  now()->year);
        $month = $request->get('month', now()->month);
        $date  = $request->get('date',  now()->toDateString());

        $query = WaterTransaction::query();

        if ($type === 'daily') {
            $query->whereDate('created_at', $date);
            $label = $date;
        } elseif ($type === 'monthly') {
            $query->whereYear('created_at', $year)
                  ->whereMonth('created_at', $month);
            $label = Carbon::createFromDate($year, $month, 1)->format('F Y');
        } else {
            $query->whereYear('created_at', $year);
            $label = (string) $year;
        }

        $transactions = $query->orderBy('created_at', 'desc')->get();

        $totalSales   = $transactions->sum('price');
        $totalGallons = $transactions->sum('total_gallons');
        $totalOrders  = $transactions->count();

        // Also pull the always-needed summary stats for context cards
        $today          = Carbon::today();
        $startOfMonth   = Carbon::now()->startOfMonth();
        $startOfYear    = Carbon::now()->startOfYear();

        $dailySales   = WaterTransaction::whereDate('created_at', $today)->sum('price');
        $dailyGallons = WaterTransaction::whereDate('created_at', $today)->sum('total_gallons');
        $monthlySales = WaterTransaction::where('created_at', '>=', $startOfMonth)->sum('price');
        $yearlySales  = WaterTransaction::where('created_at', '>=', $startOfYear)->sum('price');

        return response()->json([
            'label'         => $label,
            'type'          => $type,
            'total_sales'   => (float) $totalSales,
            'total_gallons' => (float) $totalGallons,
            'total_orders'  => $totalOrders,
            'transactions'  => $transactions,
            'summary' => [
                'daily_sales'   => (float) $dailySales,
                'daily_gallons' => (float) $dailyGallons,
                'monthly_sales' => (float) $monthlySales,
                'yearly_sales'  => (float) $yearlySales,
            ],
        ]);
    }
}
