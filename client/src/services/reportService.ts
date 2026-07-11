import api from './api';
import type { CreditSale } from '../types/report';

export const reportService = {
  getDailySales: async (date?: string) => {
    const response = await api.get('/reports/daily', { params: { date } });
    return response.data;
  },

  getMonthlySales: async (year?: number, month?: number) => {
    const response = await api.get('/reports/monthly', { params: { year, month } });
    return response.data;
  },

  getYearlySales: async (year?: number) => {
    const response = await api.get('/reports/yearly', { params: { year } });
    return response.data;
  },

  getItemSales: async (startDate?: string, endDate?: string, categoryId?: number) => {
    const response = await api.get('/reports/item-sales', {
      params: { start_date: startDate, end_date: endDate, category_id: categoryId },
    });
    return response.data;
  },

  getCreditSales: async () => {
    const response = await api.get<CreditSale[]>('/reports/credit-sales');
    return response.data;
  },

  getWaterReport: async (type: string, year?: number, month?: number, date?: string) => {
    const response = await api.get('/reports/water-sales', {
      params: { type, year, month, date }
    });
    return response.data;
  },
};

