export type Category = {
  id: number;
  name: string;
  description?: string;
  products_count?: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: number;
  name: string;
  size?: string;
  description?: string;
  category_id: number;
  category?: Category;
  price: number;
  stock: number;
  low_stock_threshold: number;
  image?: string;
  sku?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
