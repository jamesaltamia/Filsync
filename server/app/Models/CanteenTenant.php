<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CanteenTenant extends Model
{
    protected $fillable = ['name', 'contact_number', 'stall_id', 'contract_start'];

    public function stall()
    {
        return $this->belongsTo(CanteenStall::class, 'stall_id');
    }

    public function bills()
    {
        return $this->hasMany(CanteenBill::class, 'tenant_id');
    }
}