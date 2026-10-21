<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'total_items' => $this['total_items'],
            'low_stock_items' => $this['low_stock_items'],
            'pending_requests' => $this['pending_requests'],
            'stock_movements_this_week' => $this['stock_movements_this_week'],
            'total_inventory_value' => $this['total_inventory_value'],
            'total_stock_value' => $this['total_inventory_value'],
        ];
    }
}
