export interface DailySales {
  total_orders: number;
  total_revenue: number;
  total_subtotal: number;
  total_items: number;
}

export interface MonthlySales extends DailySales { }

export interface YearlySales extends DailySales { }

export interface ItemSales {
  product: {
    size: any;
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  };
  total_quantity: number;
  total_revenue: number;
}

export interface CreditSale {
  id: number;
  order_number: string;
  teacher_name: string;
  date: string;
  total: number;
  status: 'Paid' | 'Unpaid';
}



