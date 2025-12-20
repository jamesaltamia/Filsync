import api from './api';
import type { Customer } from '../types/customer';

export const customerService = {
  getCustomers: async (params?: {
    search?: string;
    type?: 'student' | 'teacher';
    page?: number;
  }) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomer: async (id: number) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: number, data: Partial<Customer>) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  searchCustomers: async (query: string) => {
    const response = await api.get('/customers/search', { params: { q: query } });
    return response.data;
  },

  importCustomers: async (file: File, type: 'student' | 'teacher') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await api.post('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

