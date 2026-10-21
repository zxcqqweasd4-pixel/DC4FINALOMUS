<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\StockRequestController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', DashboardController::class)->middleware('role:admin');

    Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
    Route::apiResource('suppliers', SupplierController::class)->only(['index', 'show']);
    Route::apiResource('items', ItemController::class)->only(['index', 'show']);
    Route::post('/items/{item}/stock-out', [ItemController::class, 'stockOut']);
    Route::apiResource('stock-requests', StockRequestController::class)->only(['index', 'store', 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('categories', CategoryController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('suppliers', SupplierController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('items', ItemController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('users', UserController::class);
        Route::patch('/stock-requests/{stock_request}/status', [StockRequestController::class, 'updateStatus']);
        Route::apiResource('stock-requests', StockRequestController::class)->only(['update', 'destroy']);
    });
});
