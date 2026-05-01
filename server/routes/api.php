<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\CanteenController;
use Illuminate\Support\Facades\Route;

// Public routes (no authentication required) - with rate limiting
Route::middleware(['throttle.auth:5,15'])->group(function () {
Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

// Categories
Route::apiResource('categories', CategoryController::class);

// Inventory
Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock']);
Route::apiResource('inventory', InventoryController::class);

// Stock Management
Route::put('/stock/{id}', [StockController::class, 'update']);

// Sales (POS)
Route::get('/sales/products', [SalesController::class, 'index']);
Route::get('/sales/products/barcode', [SalesController::class, 'findByBarcode']);
Route::post('/sales', [SalesController::class, 'store']);

// Orders History
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::put('/orders/{id}/mark-paid', [OrderController::class, 'markAsPaid']);

// Customers
Route::get('/customers/search', [CustomerController::class, 'search']);
Route::post('/customers/import', [CustomerController::class, 'import']);
Route::apiResource('customers', CustomerController::class);

// Reports
Route::get('/reports/daily', [ReportController::class, 'daily']);
Route::get('/reports/monthly', [ReportController::class, 'monthly']);
Route::get('/reports/yearly', [ReportController::class, 'yearly']);
Route::get('/reports/item-sales', [ReportController::class, 'itemSales']);
Route::get('/reports/credit-sales', [ReportController::class, 'creditSales']);
Route::get('/reports/water-sales', [ReportController::class, 'waterSales']);

// 2. Canteen Management Routes added here
    Route::prefix('canteen')->group(function () {
        // Stalls
        Route::get('/stalls', [CanteenController::class, 'getStalls']);
        Route::post('/stalls', [CanteenController::class, 'storeStall']);

        Route::put('/stalls/{id}', [CanteenController::class, 'updateStall']);
        Route::delete('/stalls/{id}', [CanteenController::class, 'destroyStall']);

        // Tenants
        Route::post('/tenants', [CanteenController::class, 'storeTenant']);

        // Billing & Payments
        Route::get('/bills', [CanteenController::class, 'getBills']);
        Route::post('/bills/generate', [CanteenController::class, 'generateMonthlyBills']);
        Route::post('/bills/{id}/pay', [CanteenController::class, 'markAsPaid']);
    });

    // Water Station Routes
    Route::prefix('water')->group(function () {
        Route::post('/transactions', [\App\Http\Controllers\WaterTransactionController::class, 'store']);
        Route::get('/dashboard', [\App\Http\Controllers\WaterTransactionController::class, 'dashboard']);
    });

    // Stock Room Routes
    Route::prefix('stock-room')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\StockRoomController::class, 'stats']);
        Route::get('/', [\App\Http\Controllers\StockRoomController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\StockRoomController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\StockRoomController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\StockRoomController::class, 'destroy']);
        Route::post('/{id}/adjust', [\App\Http\Controllers\StockRoomController::class, 'adjust']);
        Route::post('/{id}/status', [\App\Http\Controllers\StockRoomController::class, 'updateStatus']);
        Route::post('/{id}/transfer', [\App\Http\Controllers\StockRoomController::class, 'transfer']);
        Route::get('/{id}/transfers', [\App\Http\Controllers\StockRoomController::class, 'transferHistory']);
        Route::get('/{id}/adjustments', [\App\Http\Controllers\StockRoomController::class, 'adjustHistory']);
    });

    // Settings
    Route::get('/settings/{key}/value', [SettingsController::class, 'getValue']);
    Route::put('/settings/{key}/value', [SettingsController::class, 'setValue']);
    Route::post('/settings/bulk-update', [SettingsController::class, 'bulkUpdate']);
    Route::get('/settings/get-by-keys', [SettingsController::class, 'getByKeys']);
    Route::apiResource('settings', SettingsController::class);
});
