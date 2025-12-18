import api from './api';
import type { Product } from '../types/product';
import type { Order } from '../types/order';

export const salesService = {
  getProducts: async (params?: {
    category_id?: number;
    search?: string;
  }) => {
    const response = await api.get('/sales/products', { params });
    return response.data;
  },

  createOrder: async (data: {
    customer_id?: number;
    items: Array<{
      product_id: number;
      quantity: number;
    }>;
    tax_rate?: number;
    payment_method?: 'cash' | 'credit';
  }) => {
    const response = await api.post('/sales', data);
    return response.data;
  },
};

