<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\StoreStockOutRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Item::query()->with(['category', 'supplier']);

        if ($search = $request->query('search')) {
            $items->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $items->when($request->query('category_id'), fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->query('supplier_id'), fn ($query, $id) => $query->where('supplier_id', $id));

        if ($request->boolean('low_stock')) {
            $items->whereColumn('quantity', '<=', 'reorder_level');
        }

        return response()->json($items->orderBy('name')->paginate());
    }

    public function store(StoreItemRequest $request): JsonResponse
    {
        return response()->json(Item::create($request->validated()), 201);
    }

    public function show(Item $item): JsonResponse
    {
        return response()->json($item->load(['category', 'supplier']));
    }

    public function update(UpdateItemRequest $request, Item $item): JsonResponse
    {
        $item->update($request->validated());

        return response()->json($item->refresh()->load(['category', 'supplier']));
    }

    public function destroy(Item $item): JsonResponse
    {
        if ($item->stockRequests()->exists() || $item->stockMovements()->exists()) {
            return response()->json(['message' => 'This item has stock history and cannot be deleted.'], 409);
        }

        $item->delete();

        return response()->json(null, 204);
    }

    public function stockOut(StoreStockOutRequest $request, Item $item): JsonResponse
    {
        $movement = DB::transaction(function () use ($request, $item) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);
            $quantity = $request->validated('quantity');

            if ($lockedItem->quantity < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['The requested stock-out quantity exceeds available stock.'],
                ]);
            }

            $lockedItem->decrement('quantity', $quantity);

            return StockMovement::create([
                'item_id' => $lockedItem->id,
                'user_id' => $request->user()->id,
                'type' => 'out',
                'quantity' => $quantity,
                'remarks' => $request->validated('remarks'),
            ]);
        });

        return response()->json([
            'movement' => $movement->load(['item', 'user']),
            'item' => $item->refresh(),
        ], 201);
    }
}
