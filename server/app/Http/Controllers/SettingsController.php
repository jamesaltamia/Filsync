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

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.type' => 'nullable|in:string,number,boolean,json',
        ]);

        foreach ($validated['settings'] as $setting) {
            Setting::setValue(
                $setting['key'],
                (string) $setting['value'],
                $setting['type'] ?? 'string',
                null
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function getByKeys(Request $request)
    {
        $keysInput = $request->input('keys');
        $keys = is_array($keysInput) ? $keysInput : (is_string($keysInput) ? explode(',', $keysInput) : []);
        
        if (empty($keys)) {
            return response()->json([]);
        }

        $settings = Setting::whereIn('key', $keys)->get();
        
        $result = [];
        foreach ($keys as $key) {
            $setting = $settings->firstWhere('key', $key);
            $result[$key] = $setting ? $this->castValue($setting->value, $setting->type) : null;
        }

        return response()->json($result);
    }

    private function castValue($value, $type)
    {
        switch ($type) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'number':
                return is_numeric($value) ? (strpos($value, '.') !== false ? (float) $value : (int) $value) : 0;
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }
}
