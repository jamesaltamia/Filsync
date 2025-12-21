<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CanteenStall extends Model
{
    protected $fillable = ['name', 'location', 'monthly_rent', 'status'];

    public function tenant()
    {
        return $this->hasOne(CanteenTenant::class, 'stall_id');
    }
}