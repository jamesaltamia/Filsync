import api from './api';
import type { Order } from '../types/order';

export const orderService = {
  getOrders: async (params?: {
    start_date?: string;
    end_date?: string;
    customer_id?: number;
    search?: string;
    page?: number;
  }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  markAsPaid: async (id: number) => {
    const response = await api.put(`/orders/${id}/mark-paid`);
    return response.data;
  },
};

