export interface DailySales {
  total_orders: number;
  total_revenue: number;
  total_subtotal: number;
  total_tax: number;
}

export interface MonthlySales extends DailySales {}

export interface YearlySales extends DailySales {}

export interface ItemSales {
  product: {
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

