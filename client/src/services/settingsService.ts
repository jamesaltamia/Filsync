import api from './api';

export type SettingValue = string | number | boolean | null;

export interface Setting {
  key: string;
  value: SettingValue;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
}

export interface SettingsData {
  // Inventory Control Settings
  default_low_stock_alert_quantity: number;
  prevent_sale_if_stock_zero: boolean;
  allow_negative_stock: boolean;
  stock_adjustment_permission: 'admin' | 'all';

  // Product & Barcode Settings
  enable_product_variants: boolean;
  variant_size_enabled: boolean;
  variant_gender_enabled: boolean;
  barcode_per_variant: boolean;
  auto_generate_barcode: boolean;
  allow_duplicate_products: boolean;

  // User & Access Control
  role_based_access_enabled: boolean;
  cashier_cannot_delete_sales: boolean;
  cashier_cannot_edit_inventory: boolean;
  admin_override_enabled: boolean;

  // Receipt Settings
  receipt_header_text: string;
  receipt_footer_text: string;
  receipt_show_store_info: boolean;
  receipt_show_customer_info: boolean;
}

export const settingsService = {
  getAll: async (): Promise<Setting[]> => {
    const response = await api.get('/settings');
    return response.data;
  },

  getByKeys: async (keys: string[]): Promise<Record<string, SettingValue>> => {
    const response = await api.get('/settings/get-by-keys', {
      params: { keys: keys.join(',') },
    });
    return response.data;
  },

  getValue: async (key: string): Promise<SettingValue> => {
    const response = await api.get(`/settings/${key}/value`);
    return response.data.value;
  },

  setValue: async (key: string, value: SettingValue, type: Setting['type'] = 'string'): Promise<void> => {
    await api.put(`/settings/${key}/value`, {
      value: String(value),
      type,
    });
  },

  bulkUpdate: async (settings: Array<{ key: string; value: SettingValue; type?: Setting['type'] }>): Promise<void> => {
    await api.post('/settings/bulk-update', {
      settings: settings.map(s => ({
        key: s.key,
        value: String(s.value),
        type: s.type || 'string',
      })),
    });
  },
};

