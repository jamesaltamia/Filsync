import api from './api'; // Assuming you have a base api config
import type { Stall, Tenant, Bill } from '../types/canteen';

export const canteenService = {
    // Stalls
    getStalls: async (): Promise<Stall[]> => {
        const response = await api.get('/canteen/stalls');
        return response.data;
    },
    createStall: async (data: any): Promise<Stall> => {
        const response = await api.post('/canteen/stalls', data);
        return response.data;
    },

    // Tenants
    createTenant: async (data: any): Promise<Tenant> => {
        const response = await api.post('/canteen/tenants', data);
        return response.data;
    },

    // Billing
    getBills: async (): Promise<Bill[]> => {
        const response = await api.get('/canteen/bills');
        return response.data;
    },
    generateBills: async (): Promise<{ message: string }> => {
        const response = await api.post('/canteen/bills/generate');
        return response.data;
    },
    payBill: async (id: number): Promise<Bill> => {
        const response = await api.post(`/canteen/bills/${id}/pay`);
        return response.data;
    }
};