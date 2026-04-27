<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockRoomProduct extends Model
{
    protected $guarded = [];

    protected $casts = [
        'cost_price'    => 'float',
        'selling_price' => 'float',
        'quantity'      => 'integer',
        'low_stock_threshold' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function transfers()
    {
        return $this->hasMany(StockTransfer::class);
    }

    // Computed status taking quantity into account
    public function getComputedStatusAttribute(): string
    {
        if ($this->quantity <= 0) return 'out_of_stock';
        if ($this->status === 'damaged') return 'damaged';
        if ($this->status === 'reserved') return 'reserved';
        if ($this->status === 'hold') return 'hold';
        if ($this->quantity <= $this->low_stock_threshold) return 'low_stock';
        return 'available';
    }
}
