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

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_inventory_metrics_for_admins(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Paper', 'description' => 'Paper products']);
        $supplier = Supplier::create(['name' => 'Northstar Office Supplies']);

        $lowStockItem = Item::create([
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'name' => 'A4 Bond Paper 80gsm',
            'sku' => 'PAPER-A4-80',
            'unit' => 'ream',
            'quantity' => 3,
            'reorder_level' => 5,
            'unit_price' => 125.00,
        ]);
        Item::create([
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'name' => 'Ballpoint Pen Blue',
            'sku' => 'PEN-BLUE-01',
            'unit' => 'box',
            'quantity' => 10,
            'reorder_level' => 5,
            'unit_price' => 75.00,
        ]);

        StockRequest::create([
            'item_id' => $lowStockItem->id,
            'user_id' => $user->id,
            'direction' => 'in',
            'quantity' => 2,
            'reason' => 'Restock the supply cabinet',
        ]);
        StockMovement::create([
            'item_id' => $lowStockItem->id,
            'user_id' => $user->id,
            'type' => 'in',
            'quantity' => 3,
        ]);

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total_items', 2)
            ->assertJsonPath('data.low_stock_items', 1)
            ->assertJsonPath('data.pending_requests', 1)
            ->assertJsonPath('data.stock_movements_this_week', 1)
            ->assertJsonPath('data.total_inventory_value', 1125);
    }

    public function test_dashboard_is_not_available_to_staff(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'staff']))
            ->getJson('/api/dashboard')
            ->assertForbidden();
    }

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_user_can_register_and_receive_a_sanctum_token(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Jordan Lee',
            'email' => 'jordan.lee@example.com',
            'password' => 'OfficeSupplies2026',
            'password_confirmation' => 'OfficeSupplies2026',
        ])->assertCreated()
            ->assertJsonPath('user.role', 'staff')
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);
    }

    public function test_user_can_login_get_current_user_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@example.com',
            'password' => bcrypt('OfficeSupplies2026'),
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'staff@example.com',
            'password' => 'OfficeSupplies2026',
        ])->assertOk()
            ->assertJsonStructure(['user', 'token']);

        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);

        $this->withToken($token)->postJson('/api/logout')->assertNoContent();
    }
}
