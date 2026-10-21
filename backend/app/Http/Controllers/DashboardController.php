<?php

namespace App\Http\Controllers;

use App\Http\Resources\DashboardResource;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockRequest;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(): DashboardResource
    {
        return new DashboardResource([
            'total_items' => Item::count(),
            'low_stock_items' => Item::whereColumn('quantity', '<=', 'reorder_level')->count(),
            'pending_requests' => StockRequest::where('status', 'pending')->count(),
            'stock_movements_this_week' => StockMovement::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ])->count(),
            'total_inventory_value' => (float) Item::query()->sum(
                DB::raw('quantity * unit_price')
            ),
        ]);
    }
}
