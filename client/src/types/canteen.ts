export interface Stall {
  id: number;
  name: string;
  location: string;
  monthly_rent: number | string;
  status: 'available' | 'occupied';
  tenant?: Tenant; // Optional relationship
}

export interface Tenant {
  id: number;
  name: string;
  contact_number: string;
  stall_id: number;
  contract_start: string;
  stall?: Stall;
}

export interface Bill {
  tenant: any;
  id: number;
  tenant_id: number;
  tenant_name: string; // Helper from backend
  stall_name: string;  // Helper from backend
  month_year: string;
  amount: number;
  status: 'paid' | 'unpaid';
  paid_at?: string;
}

export interface Stall {
  id: number;
  name: string;
  location: string;
  monthly_rent: number | string;
  status: 'available' | 'occupied';
  tenant?: Tenant;
}