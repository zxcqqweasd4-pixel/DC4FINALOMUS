<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->change();
        });

        DB::table('users')->where('role', 'resident')->update(['role' => 'staff']);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'staff')->update(['role' => 'resident']);

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'resident'])->default('resident')->change();
        });
    }
};
