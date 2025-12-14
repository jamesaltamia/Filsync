import api from './api';
import type { Product, Category } from '../types/product';

export const inventoryService = {
  getProducts: async (params?: {
    category_id?: number;
    search?: string;
    is_active?: boolean;
    page?: number;
  }) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getProduct: async (id: number) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  createProduct: async (data: Partial<Product> | FormData) => {
    const config = data instanceof FormData 
      ? {} // Let browser set Content-Type with boundary for FormData
      : { headers: { 'Content-Type': 'application/json' } };
    const response = await api.post('/inventory', data, config);
    return response.data;
  },

  updateProduct: async (id: number, data: Partial<Product> | FormData) => {
    const config = data instanceof FormData 
      ? {} // Let browser set Content-Type with boundary for FormData
      : { headers: { 'Content-Type': 'application/json' } };
    const response = await api.post(`/inventory/${id}?_method=PUT`, data, config);
    return response.data;
  },

  deleteProduct: async (id: number) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  updateStock: async (id: number, quantity: number, type: 'add' | 'subtract' | 'set') => {
    const response = await api.put(`/stock/${id}`, { quantity, type });
    return response.data;
  },
};

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategory: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: Partial<Category>) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<Category>) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

