<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    protected $guarded = [];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function stockRoomProduct()
    {
        return $this->belongsTo(StockRoomProduct::class);
    }

    public function inventoryProduct()
    {
        return $this->belongsTo(Product::class, 'inventory_product_id');
    }
}
