<?php

namespace App\Http\Controllers;

use App\Models\CanteenStall;
use App\Models\CanteenTenant;
use App\Models\CanteenBill;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CanteenController extends Controller
{
    public function getStalls() {
        // Loads the stall AND the current tenant assigned to it
        return response()->json(CanteenStall::with('tenant')->get());
    }

    public function storeStall(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string',
            'location' => 'required|string',
            'monthly_rent' => 'required|numeric',
        ]);

        $stall = CanteenStall::create($validated);
        return response()->json($stall, 201);
    }

    public function storeTenant(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string',
            'contact_number' => 'nullable|string',
            'stall_id' => 'required|exists:canteen_stalls,id',
            'contract_start' => 'required|date',
        ]);

        return DB::transaction(function () use ($validated) {
            $tenant = CanteenTenant::create($validated);
            
            // Mark stall as Occupied so no one else can take it
            CanteenStall::where('id', $validated['stall_id'])->update(['status' => 'occupied']);
            
            return response()->json($tenant, 201);
        });
    }

    public function getBills() {
        // Nested relationship: Bill -> Tenant -> Stall
        return response()->json(
            CanteenBill::with(['tenant.stall'])->orderBy('created_at', 'desc')->get()
        );
    }

    public function generateMonthlyBills() {
        $tenants = CanteenTenant::with('stall')->get();
        $monthYear = Carbon::now()->format('F Y');
        $count = 0;

        foreach ($tenants as $tenant) {
            if (!$tenant->stall) continue; // Safety check

            $exists = CanteenBill::where('tenant_id', $tenant->id)
                                 ->where('month_year', $monthYear)
                                 ->exists();

            if (!$exists) {
                CanteenBill::create([
                    'tenant_id' => $tenant->id,
                    'month_year' => $monthYear,
                    'amount' => $tenant->stall->monthly_rent,
                    'status' => 'unpaid'
                ]);
                $count++;
            }
        }

        return response()->json(['message' => "Generated $count bills for $monthYear"]);
    }

    public function markAsPaid($id) {
        $bill = CanteenBill::findOrFail($id);
        $bill->update([
            'status' => 'paid',
            'paid_at' => Carbon::now()
        ]);

        return response()->json(['message' => 'Payment recorded', 'bill' => $bill]);
    }
}