import api from './api';
import type { StockRoomProduct, StockRoomStats, StockTransfer } from '../types/stockRoom';

export const stockRoomService = {
  getStats: async (): Promise<StockRoomStats> => {
    const res = await api.get('/stock-room/stats');
    return res.data;
  },

  getProducts: async (params?: {
    search?: string;
    category_id?: number;
    status?: string;
    sort?: string;
    dir?: string;
    page?: number;
  }) => {
    const res = await api.get('/stock-room/', { params });
    return res.data;
  },

  createProduct: async (data: Partial<StockRoomProduct>) => {
    const res = await api.post('/stock-room/', data);
    return res.data as StockRoomProduct;
  },

  updateProduct: async (id: number, data: Partial<StockRoomProduct>) => {
    const res = await api.put(`/stock-room/${id}`, data);
    return res.data as StockRoomProduct;
  },

  deleteProduct: async (id: number) => {
    const res = await api.delete(`/stock-room/${id}`);
    return res.data;
  },

  adjust: async (id: number, type: 'add' | 'subtract' | 'set', quantity: number, notes?: string) => {
    const res = await api.post(`/stock-room/${id}/adjust`, { type, quantity, notes });
    return res.data as StockRoomProduct;
  },

  updateStatus: async (id: number, status: string) => {
    const res = await api.post(`/stock-room/${id}/status`, { status });
    return res.data as StockRoomProduct;
  },

  transfer: async (id: number, data: {
    quantity: number;
    inventory_product_id?: number;
    transferred_by?: string;
    notes?: string;
  }) => {
    const res = await api.post(`/stock-room/${id}/transfer`, data);
    return res.data;
  },

  getTransferHistory: async (id: number): Promise<StockTransfer[]> => {
    const res = await api.get(`/stock-room/${id}/transfers`);
    return res.data;
  },
};
