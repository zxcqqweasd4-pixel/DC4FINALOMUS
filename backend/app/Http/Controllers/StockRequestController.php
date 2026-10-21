<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockRequestRequest;
use App\Http\Requests\UpdateStockRequestRequest;
use App\Http\Requests\UpdateStockRequestStatusRequest;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $requests = StockRequest::query()->with(['item', 'user', 'approver'])->latest();

        if (! $request->user()->isAdmin()) {
            $requests->where('user_id', $request->user()->id);
        }

        return response()->json($requests->paginate());
    }

    public function store(StoreStockRequestRequest $request): JsonResponse
    {
        $stockRequest = StockRequest::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json($stockRequest->load(['item', 'user', 'approver']), 201);
    }

    public function show(Request $request, StockRequest $stockRequest): JsonResponse
    {
        if (! $request->user()->isAdmin() && $stockRequest->user_id !== $request->user()->id) {
            abort(404);
        }

        return response()->json($stockRequest->load(['item', 'user', 'approver']));
    }

    public function update(UpdateStockRequestRequest $request, StockRequest $stockRequest): JsonResponse
    {
        if ($stockRequest->status !== 'pending') {
            throw ValidationException::withMessages([
                'stock_request' => ['Only pending requests can be edited.'],
            ]);
        }

        $stockRequest->update($request->validated());

        return response()->json($stockRequest->refresh()->load(['item', 'user', 'approver']));
    }

    public function updateStatus(UpdateStockRequestStatusRequest $request, StockRequest $stockRequest): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $stockRequest) {
            $lockedRequest = StockRequest::query()->lockForUpdate()->findOrFail($stockRequest->id);
            $nextStatus = $request->validated('status');
            $allowedTransitions = [
                'pending' => ['approved', 'rejected'],
                'approved' => ['completed', 'rejected'],
                'completed' => [],
                'rejected' => [],
            ];

            if (! in_array($nextStatus, $allowedTransitions[$lockedRequest->status], true)) {
                throw ValidationException::withMessages([
                    'status' => ["Cannot transition a {$lockedRequest->status} request to {$nextStatus}."],
                ]);
            }

            $lockedRequest->approved_by = $request->user()->id;

            if ($nextStatus === 'completed') {
                $item = Item::query()->lockForUpdate()->findOrFail($lockedRequest->item_id);

                if ($lockedRequest->direction === 'out' && $item->quantity < $lockedRequest->quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => ['The request exceeds available stock.'],
                    ]);
                }

                if ($lockedRequest->direction === 'in') {
                    $item->increment('quantity', $lockedRequest->quantity);
                } else {
                    $item->decrement('quantity', $lockedRequest->quantity);
                }

                StockMovement::create([
                    'item_id' => $item->id,
                    'user_id' => $request->user()->id,
                    'type' => $lockedRequest->direction,
                    'quantity' => $lockedRequest->quantity,
                    'remarks' => $lockedRequest->reason,
                ]);
            }

            $lockedRequest->status = $nextStatus;
            $lockedRequest->save();

            return $lockedRequest->load(['item', 'user', 'approver']);
        });

        return response()->json($result);
    }

    public function destroy(StockRequest $stockRequest): JsonResponse
    {
        if ($stockRequest->status !== 'pending') {
            throw ValidationException::withMessages([
                'stock_request' => ['Only pending requests can be deleted.'],
            ]);
        }

        $stockRequest->delete();

        return response()->json(null, 204);
    }
}
