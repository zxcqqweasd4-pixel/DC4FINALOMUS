<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'supplier_id' => ['sometimes', 'required', 'integer', 'exists:suppliers,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'sku' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('items', 'sku')->ignore($this->route('item'))],
            'unit' => ['sometimes', 'required', 'string', 'max:50'],
            'description' => ['sometimes', 'nullable', 'string'],
            'quantity' => ['sometimes', 'required', 'integer', 'min:0'],
            'reorder_level' => ['sometimes', 'required', 'integer', 'min:0'],
            'unit_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'image_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ];
    }
}
