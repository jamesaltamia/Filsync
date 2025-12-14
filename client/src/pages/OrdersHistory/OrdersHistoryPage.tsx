import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types/order';
import { formatCurrency } from '../../utils/formatCurrency';
import { printReceipt } from '../../utils/generateReceipt';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';

export const OrdersHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const order = await orderService.getOrder(id);
      setSelectedOrder(order);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handlePrintReceipt = (order: Order) => {
    printReceipt(order);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders History</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">{order.order_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.customer
                    ? `${order.customer.first_name} ${order.customer.last_name}`
                    : 'Walk-in'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(order.id)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePrintReceipt(order)}
                  >
                    Print
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        title={`Order Details - ${selectedOrder?.order_number}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-medium">{selectedOrder.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              {selectedOrder.customer && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">
                      {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}
                    </p>
                  </div>
                  {selectedOrder.customer.student_id && (
                    <div>
                      <p className="text-sm text-gray-600">Student ID</p>
                      <p className="font-medium">{selectedOrder.customer.student_id}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({selectedOrder.tax_rate}%):</span>
                <span>{formatCurrency(selectedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-green-600 border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handlePrintReceipt(selectedOrder)}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

