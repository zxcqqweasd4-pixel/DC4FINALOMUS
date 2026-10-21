<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return UserResource::collection(User::query()->orderBy('name')->paginate())->response();
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['role'] ??= 'staff';

        return response()->json(new UserResource(User::create($data)), 201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        return new UserResource($user->refresh());
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'You cannot delete your own account.'], 409);
        }

        if ($user->stockRequests()->exists() || $user->approvedStockRequests()->exists()
            || $user->stockMovements()->exists()) {
            return response()->json(['message' => 'This user has related records and cannot be deleted.'], 409);
        }

        $user->delete();

        return response()->json(null, 204);
    }
}
