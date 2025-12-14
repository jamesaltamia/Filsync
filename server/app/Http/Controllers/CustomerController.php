<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\CustomerImportService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    protected $importService;

    public function __construct(CustomerImportService $importService)
    {
        $this->importService = $importService;
    }

    public function index(Request $request)
    {
        $query = Customer::query();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $customers = $query->orderBy('last_name')->paginate(20);
        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'nullable|string|unique:customers,student_id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'phone' => 'nullable|string',
            'type' => 'required|in:student,teacher',
        ]);

        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show(string $id)
    {
        $customer = Customer::with('orders')->findOrFail($id);
        return response()->json($customer);
    }

    public function update(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'student_id' => 'nullable|string|unique:customers,student_id,' . $id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'phone' => 'nullable|string',
            'type' => 'required|in:student,teacher',
        ]);

        $customer->update($validated);
        return response()->json($customer);
    }

    public function destroy(string $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();
        return response()->json(['message' => 'Customer deleted successfully']);
    }

    public function search(Request $request)
    {
        $search = $request->get('q', '');
        
        $customers = Customer::where('student_id', 'like', "%{$search}%")
            ->orWhere('last_name', 'like', "%{$search}%")
            ->orWhere('first_name', 'like', "%{$search}%")
            ->limit(10)
            ->get();

        return response()->json($customers);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            $result = $this->importService->importFromExcel($request->file('file'));
            
            return response()->json([
                'message' => 'Import completed',
                'imported' => $result['imported'],
                'errors' => $result['errors'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
