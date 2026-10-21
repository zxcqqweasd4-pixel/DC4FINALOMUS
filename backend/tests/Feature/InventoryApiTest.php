<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockRequest;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_browse_paginated_filtered_items_and_reference_data(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        [$category, $supplier, $lowStockItem] = $this->createItem([
            'name' => 'Blue Ballpoint Pen',
            'sku' => 'PEN-BLUE',
            'quantity' => 2,
            'reorder_level' => 5,
        ]);
        $this->createItem([
            'name' => 'Red Marker',
            'sku' => 'MARKER-RED',
            'quantity' => 12,
            'reorder_level' => 5,
        ]);

        $this->actingAs($staff)
            ->getJson('/api/items?search=BLUE&category_id='.$category->id.'&supplier_id='.$supplier->id.'&low_stock=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $lowStockItem->id)
            ->assertJsonPath('per_page', 15);

        $this->getJson('/api/categories')->assertOk()->assertJsonPath('current_page', 1);
        $this->getJson('/api/suppliers')->assertOk()->assertJsonPath('current_page', 1);
        $this->postJson('/api/items', [])->assertForbidden();
    }

    public function test_staff_requests_are_scoped_to_the_authenticated_user(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $otherStaff = User::factory()->create(['role' => 'staff']);
        [, , $item] = $this->createItem();
        $ownRequest = StockRequest::create([
            'item_id' => $item->id,
            'user_id' => $staff->id,
            'direction' => 'in',
            'quantity' => 4,
            'reason' => 'Replenish office stock',
        ]);
        $otherRequest = StockRequest::create([
            'item_id' => $item->id,
            'user_id' => $otherStaff->id,
            'direction' => 'out',
            'quantity' => 1,
            'reason' => 'Use supplies',
        ]);

        $this->actingAs($staff)
            ->getJson('/api/stock-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownRequest->id);

        $this->getJson('/api/stock-requests/'.$otherRequest->id)->assertNotFound();
        $this->postJson('/api/stock-requests', [
            'item_id' => $item->id,
            'direction' => 'in',
            'quantity' => 1,
            'reason' => 'Return stock',
            'user_id' => $otherStaff->id,
        ])->assertCreated()->assertJsonPath('user_id', $staff->id);
    }

    public function test_admin_status_workflow_updates_stock_and_records_one_movement(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [, , $item] = $this->createItem(['quantity' => 5]);
        $stockRequest = StockRequest::create([
            'item_id' => $item->id,
            'user_id' => User::factory()->create()->id,
            'direction' => 'out',
            'quantity' => 3,
            'reason' => 'Issue supplies',
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/stock-requests/{$stockRequest->id}/status", ['status' => 'completed'])
            ->assertUnprocessable();

        $this->patchJson("/api/stock-requests/{$stockRequest->id}/status", ['status' => 'approved'])
            ->assertOk()->assertJsonPath('status', 'approved');
        $this->patchJson("/api/stock-requests/{$stockRequest->id}/status", ['status' => 'completed'])
            ->assertOk()->assertJsonPath('status', 'completed');

        $this->assertSame(2, $item->fresh()->quantity);
        $this->assertDatabaseHas('stock_movements', [
            'item_id' => $item->id,
            'type' => 'out',
            'quantity' => 3,
            'user_id' => $admin->id,
        ]);
        $this->assertSame(1, StockMovement::count());

        $this->patchJson("/api/stock-requests/{$stockRequest->id}/status", ['status' => 'completed'])
            ->assertUnprocessable();
        $this->assertSame(1, StockMovement::count());
    }

    public function test_completed_stock_out_and_direct_stock_out_cannot_make_quantity_negative(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff']);
        [, , $item] = $this->createItem(['quantity' => 2]);
        $stockRequest = StockRequest::create([
            'item_id' => $item->id,
            'user_id' => $staff->id,
            'direction' => 'out',
            'quantity' => 3,
            'reason' => 'Issue supplies',
            'status' => 'approved',
            'approved_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/stock-requests/{$stockRequest->id}/status", ['status' => 'completed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('quantity');

        $this->actingAs($staff)
            ->postJson("/api/items/{$item->id}/stock-out", ['quantity' => 3])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('quantity');

        $this->assertSame(2, $item->fresh()->quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_admin_can_create_and_update_inventory_resources_and_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $category = $this->postJson('/api/categories', ['name' => 'Stationery'])
            ->assertCreated()->json();
        $supplier = $this->postJson('/api/suppliers', ['name' => 'Supply Co'])
            ->assertCreated()->json();
        $item = $this->postJson('/api/items', [
            'category_id' => $category['id'],
            'supplier_id' => $supplier['id'],
            'name' => 'A5 Notebook',
            'sku' => 'NOTE-A5',
            'unit' => 'piece',
            'quantity' => 20,
            'reorder_level' => 4,
            'unit_price' => 35.50,
        ])->assertCreated()->json();

        $this->patchJson('/api/items/'.$item['id'], ['quantity' => 25])
            ->assertOk()->assertJsonPath('quantity', 25);
        $this->postJson('/api/users', [
            'name' => 'New Staff',
            'email' => 'new.staff@example.com',
            'password' => 'ValidPassword123',
            'password_confirmation' => 'ValidPassword123',
            'role' => 'staff',
        ])->assertCreated()->assertJsonPath('role', 'staff');
        $this->getJson('/api/users')->assertOk()->assertJsonPath('meta.current_page', 1);

        $this->postJson('/api/categories', ['name' => ''])->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    /**
     * @return array{Category, Supplier, Item}
     */
    private function createItem(array $attributes = []): array
    {
        $category = Category::create(['name' => 'Writing Supplies '.fake()->unique()->word()]);
        $supplier = Supplier::create(['name' => 'Office Supplier']);
        $item = Item::create(array_merge([
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'name' => 'Generic Item',
            'sku' => fake()->unique()->bothify('SKU-####'),
            'unit' => 'piece',
            'quantity' => 10,
            'reorder_level' => 2,
            'unit_price' => 5.00,
        ], $attributes));

        return [$category, $supplier, $item];
    }
}
