<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CanteenBill extends Model
{
    protected $fillable = ['tenant_id', 'month_year', 'amount', 'status', 'paid_at'];

    // This relationship is vital for your frontend table to work
    public function tenant()
    {
        return $this->belongsTo(CanteenTenant::class, 'tenant_id');
    }
}