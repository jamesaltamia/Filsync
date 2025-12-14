<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
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
        $sales = $this->reportService->getItemSales($startDate, $endDate);
        return response()->json($sales);
    }
}
