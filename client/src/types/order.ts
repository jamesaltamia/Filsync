import type { Product } from './product';
import type { Customer } from './customer';

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: number;
  order_number: string;
  customer_id?: number;
  customer?: Customer;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: 'cash';
  status: 'pending' | 'completed' | 'cancelled';
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
};

