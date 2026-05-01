import type { Category } from './product';

export type StockStatus = 'available' | 'reserved' | 'damaged' | 'hold';
export type ComputedStatus = 'available' | 'low_stock' | 'out_of_stock' | 'reserved' | 'damaged' | 'hold';

export type StockRoomProduct = {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  category_id: number;
  category?: Category;
  supplier?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  status: StockStatus;
  computed_status: ComputedStatus;
  image?: string;
  added_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type StockTransfer = {
  id: number;
  stock_room_product_id: number;
  inventory_product_id?: number;
  quantity: number;
  transferred_by?: string;
  notes?: string;
  created_at: string;
  inventory_product?: { id: number; name: string };
};

export type StockRoomStats = {
  total: number;
  lowStock: number;
  outOfStock: number;
  reserved: number;
  damaged: number;
  totalValue: number;
  recentTransfers: StockTransfer[];
};
