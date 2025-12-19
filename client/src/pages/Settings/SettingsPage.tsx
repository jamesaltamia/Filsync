import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { settingsService, type SettingsData } from '../../services/settingsService';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    // Inventory Control Settings
    default_low_stock_alert_quantity: 10,
    prevent_sale_if_stock_zero: true,
    allow_negative_stock: false,
    stock_adjustment_permission: 'admin',

    // Product & Barcode Settings
    enable_product_variants: true,
    variant_size_enabled: true,
    variant_gender_enabled: true,
    barcode_per_variant: true,
    auto_generate_barcode: true,
    allow_duplicate_products: false,

    // User & Access Control
    role_based_access_enabled: true,
    cashier_cannot_delete_sales: true,
    cashier_cannot_edit_inventory: true,
    admin_override_enabled: true,

    // Receipt Settings
    receipt_header_text: 'FilSync POS',
    receipt_footer_text: 'Thank you for your purchase!',
    receipt_show_store_info: true,
    receipt_show_customer_info: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const keys = Object.keys(settings) as Array<keyof SettingsData>;
      const loaded = await settingsService.getByKeys(keys);
      
      setSettings(prev => {
        const updated = { ...prev };
        keys.forEach(key => {
          if (loaded[key] !== undefined && loaded[key] !== null) {
            updated[key] = loaded[key] as any;
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
      }));

      await settingsService.bulkUpdate(settingsArray);
      alert('Settings saved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave} isLoading={saving} variant="primary">
          Save All Settings
        </Button>
      </div>

      {/* 1. Inventory Control Settings */}
      <Card title="📦 Inventory Control Settings">
        <div className="space-y-4">
          <Input
            label="Default Low Stock Alert Quantity"
            type="number"
            value={settings.default_low_stock_alert_quantity}
            onChange={(e) => updateSetting('default_low_stock_alert_quantity', Number(e.target.value))}
            description="Products with stock below this quantity will trigger low stock alerts"
          />

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.prevent_sale_if_stock_zero}
                onChange={(e) => updateSetting('prevent_sale_if_stock_zero', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Prevent Sale if Stock is Zero</span>
                <p className="text-sm text-gray-500">When enabled, products with zero stock cannot be sold</p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!settings.allow_negative_stock}
                onChange={(e) => updateSetting('allow_negative_stock', !e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Allow Negative Stock</span>
                <p className="text-sm text-gray-500">When disabled, stock cannot go below zero</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Adjustment Permission
            </label>
            <select
              value={settings.stock_adjustment_permission}
              onChange={(e) => updateSetting('stock_adjustment_permission', e.target.value as 'admin' | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="admin">Admin Only</option>
              <option value="all">All Users</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 2. Product & Barcode Settings */}
      <Card title="🏷️ Product & Barcode Settings">
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_product_variants}
                onChange={(e) => updateSetting('enable_product_variants', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Enable Product Variants</span>
                <p className="text-sm text-gray-500">Allow products to have variants (size, gender, etc.)</p>
              </div>
            </label>
          </div>

          {settings.enable_product_variants && (
            <>
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.variant_size_enabled}
                    onChange={(e) => updateSetting('variant_size_enabled', e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Size Variant (S–XL)</span>
                    <p className="text-sm text-gray-500">Enable size selection for products (e.g., Small, Medium, Large, XL, XXL)</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.variant_gender_enabled}
                    onChange={(e) => updateSetting('variant_gender_enabled', e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Gender Variant (Male/Female)</span>
                    <p className="text-sm text-gray-500">Enable gender selection for products</p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.barcode_per_variant}
                onChange={(e) => updateSetting('barcode_per_variant', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Barcode per Variant</span>
                <p className="text-sm text-gray-500">Each product variant will have its own unique barcode</p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_generate_barcode}
                onChange={(e) => updateSetting('auto_generate_barcode', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Auto-generate Barcode</span>
                <p className="text-sm text-gray-500">Automatically generate barcodes for new products/variants</p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!settings.allow_duplicate_products}
                onChange={(e) => updateSetting('allow_duplicate_products', !e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Allow Duplicate Products</span>
                <p className="text-sm text-gray-500">When disabled, prevents creating duplicate products with the same name</p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* 3. User & Access Control */}
      <Card title="👤 User & Access Control">
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.role_based_access_enabled}
                onChange={(e) => updateSetting('role_based_access_enabled', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Role-based Access</span>
                <p className="text-sm text-gray-500">Enable role-based permissions (Admin, Cashier)</p>
              </div>
            </label>
          </div>

          {settings.role_based_access_enabled && (
            <>
              <div className="ml-8 space-y-3 border-l-2 border-gray-200 pl-4">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Roles:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Admin:</strong> Full access to all features</li>
                    <li>• <strong>Cashier:</strong> Limited access (Sales, Orders History, Reports)</li>
                  </ul>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cashier_cannot_delete_sales}
                      onChange={(e) => updateSetting('cashier_cannot_delete_sales', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Cashier Restrictions: Cannot Delete Sales</span>
                      <p className="text-sm text-gray-500">Cashiers cannot delete completed sales</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cashier_cannot_edit_inventory}
                      onChange={(e) => updateSetting('cashier_cannot_edit_inventory', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Cashier Restrictions: Cannot Edit Inventory</span>
                      <p className="text-sm text-gray-500">Cashiers cannot modify product inventory</p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.admin_override_enabled}
                onChange={(e) => updateSetting('admin_override_enabled', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Admin Override</span>
                <p className="text-sm text-gray-500">Admins can override restrictions when needed</p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* 4. Receipt Settings */}
      <Card title="🧾 Receipt Settings">
        <div className="space-y-4">
          <Input
            label="Receipt Header Text"
            value={settings.receipt_header_text}
            onChange={(e) => updateSetting('receipt_header_text', e.target.value)}
            placeholder="FilSync POS"
            description="Text displayed at the top of receipts"
          />

          <Input
            label="Receipt Footer Text"
            value={settings.receipt_footer_text}
            onChange={(e) => updateSetting('receipt_footer_text', e.target.value)}
            placeholder="Thank you for your purchase!"
            description="Text displayed at the bottom of receipts"
          />

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.receipt_show_store_info}
                onChange={(e) => updateSetting('receipt_show_store_info', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Show Store Information</span>
                <p className="text-sm text-gray-500">Display store name and details on receipts</p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.receipt_show_customer_info}
                onChange={(e) => updateSetting('receipt_show_customer_info', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-700">Show Customer Information</span>
                <p className="text-sm text-gray-500">Display customer name and ID on receipts</p>
              </div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};
