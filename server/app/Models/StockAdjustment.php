<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_room_product_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'adjusted_by',
        'notes',
    ];

    public function stockRoomProduct()
    {
        return $this->belongsTo(StockRoomProduct::class);
    }
}
