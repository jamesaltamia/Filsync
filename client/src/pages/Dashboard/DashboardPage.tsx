import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';
import type { Product } from '../../types/product';
import { Link } from 'react-router-dom';

interface DashboardData {
  today_sales: {
    total_orders: number;
    total_revenue: number;
  };
  low_stock_alerts: Product[];
  recent_orders: any[];
}

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Sales</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data?.today_sales.total_revenue || 0)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Orders</p>
              <p className="text-2xl font-bold text-blue-600">
                {data?.today_sales.total_orders || 0}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {data?.low_stock_alerts.length || 0}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {data?.low_stock_alerts && data.low_stock_alerts.length > 0 && (
        <Card title="Low Stock Alerts">
          <div className="space-y-2">
            {data.low_stock_alerts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {product.stock} (Threshold: {product.low_stock_threshold})
                  </p>
                </div>
                <Link
                  to="/inventory"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Add Stock →
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Orders */}
      <Card title="Recent Orders">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.recent_orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-sm">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm">
                    {order.customer
                      ? `${order.customer.first_name} ${order.customer.last_name}`
                      : 'Walk-in'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

