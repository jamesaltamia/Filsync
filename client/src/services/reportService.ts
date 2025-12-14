import api from './api';
import type { DailySales, MonthlySales, YearlySales, ItemSales } from '../types/report';

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

  getItemSales: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/reports/item-sales', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};

