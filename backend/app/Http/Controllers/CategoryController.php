<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Category::query()->orderBy('name')->paginate());
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        return response()->json(Category::create($request->validated()), 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return response()->json($category->refresh());
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->items()->exists()) {
            return response()->json(['message' => 'This category is in use and cannot be deleted.'], 409);
        }

        $category->delete();

        return response()->json(null, 204);
    }
}
