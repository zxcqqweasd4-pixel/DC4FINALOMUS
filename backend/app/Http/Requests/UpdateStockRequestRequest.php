<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStockRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'item_id' => ['sometimes', 'required', 'integer', 'exists:items,id'],
            'direction' => ['sometimes', 'required', Rule::in(['in', 'out'])],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1'],
            'reason' => ['sometimes', 'required', 'string'],
        ];
    }
}
