<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WaterTransaction;
use Carbon\Carbon;

class WaterTransactionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'gallons' => 'required|numeric|min:0.1', // container liters/gallon size
            'quantity' => 'required|integer|min:1',
        ]);

        $containerSize = $validated['gallons'];
        $quantity = $validated['quantity'];

        // Price per gallon/container
        $pricePerUnit = 25;

        // If 3.78 liters = 1 gallon
        $gallonEquivalent = $containerSize / 3.78;

        // Total gallons sold
        $totalGallons = $gallonEquivalent * $quantity;

        // Total price
        $totalPrice = $quantity * $pricePerUnit;

        $transaction = WaterTransaction::create([
            'gallons' => $containerSize,
            'quantity' => $quantity,
            'total_gallons' => $totalGallons,
            'price' => $totalPrice,
        ]);

        return response()->json([
            'message' => 'Transaction saved successfully',
            'data' => $transaction
        ], 201);
    }

    public function dashboard()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfYear = Carbon::now()->startOfYear();

        $dailySales = WaterTransaction::whereDate('created_at', $today)->sum('price');

        // Count gallons sold properly
        $dailyGallons = WaterTransaction::whereDate('created_at', $today)->sum('total_gallons');

        $monthlySales = WaterTransaction::where('created_at', '>=', $startOfMonth)->sum('price');
        $yearlySales = WaterTransaction::where('created_at', '>=', $startOfYear)->sum('price');

        $yearlyGallons = WaterTransaction::where('created_at', '>=', $startOfYear)->sum('total_gallons');

        $chartData = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);

            $sales = WaterTransaction::whereDate('created_at', $date)->sum('price');

            $gallons = WaterTransaction::whereDate('created_at', $date)->sum('total_gallons');

            $chartData[] = [
                'date' => $date->format('M d'),
                'sales' => (float) $sales,
                'gallons' => (float) $gallons,
            ];
        }

        return response()->json([
            'stats' => [
                'dailySales' => $dailySales,
                'dailyGallons' => $dailyGallons,
                'monthlySales' => $monthlySales,
                'yearlySales' => $yearlySales,
                'yearlyGallons' => $yearlyGallons,
            ],
            'chartData' => $chartData,
        ]);
    }
}