<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all();
        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:settings,key',
            'value' => 'nullable|string',
            'type' => 'required|in:string,number,boolean,json',
            'description' => 'nullable|string',
        ]);

        $setting = Setting::create($validated);
        return response()->json($setting, 201);
    }

    public function show(string $key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();
        return response()->json($setting);
    }

    public function update(Request $request, string $key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        $validated = $request->validate([
            'value' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $setting->update($validated);
        return response()->json($setting);
    }

    public function getValue(string $key)
    {
        $value = Setting::getValue($key);
        return response()->json(['key' => $key, 'value' => $value]);
    }

    public function setValue(Request $request, string $key)
    {
        $validated = $request->validate([
            'value' => 'required|string',
            'type' => 'nullable|in:string,number,boolean,json',
            'description' => 'nullable|string',
        ]);

        Setting::setValue(
            $key,
            $validated['value'],
            $validated['type'] ?? 'string',
            $validated['description'] ?? null
        );

        return response()->json(['message' => 'Setting updated successfully']);
    }
}
