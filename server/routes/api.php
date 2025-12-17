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
use Illuminate\Support\Facades\Route;

// Public routes (no authentication required)
Route::post('/login', [AuthController::class, 'login']);

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
Route::post('/sales', [SalesController::class, 'store']);

// Orders History
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/{id}', [OrderController::class, 'show']);

// Customers
Route::get('/customers/search', [CustomerController::class, 'search']);
Route::post('/customers/import', [CustomerController::class, 'import']);
Route::apiResource('customers', CustomerController::class);

// Reports
Route::get('/reports/daily', [ReportController::class, 'daily']);
Route::get('/reports/monthly', [ReportController::class, 'monthly']);
Route::get('/reports/yearly', [ReportController::class, 'yearly']);
Route::get('/reports/item-sales', [ReportController::class, 'itemSales']);

    // Settings
    Route::get('/settings/{key}/value', [SettingsController::class, 'getValue']);
    Route::put('/settings/{key}/value', [SettingsController::class, 'setValue']);
    Route::apiResource('settings', SettingsController::class);
});
