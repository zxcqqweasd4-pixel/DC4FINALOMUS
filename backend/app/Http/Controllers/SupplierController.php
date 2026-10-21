<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Supplier::query()->orderBy('name')->paginate());
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        return response()->json(Supplier::create($request->validated()), 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier->update($request->validated());

        return response()->json($supplier->refresh());
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        if ($supplier->items()->exists()) {
            return response()->json(['message' => 'This supplier is assigned to items and cannot be deleted.'], 409);
        }

        $supplier->delete();

        return response()->json(null, 204);
    }
}
