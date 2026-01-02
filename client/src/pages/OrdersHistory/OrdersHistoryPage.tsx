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
    const cash = order.cash_tendered != null ? Number(order.cash_tendered) : undefined;
    const change = order.change_due != null ? Number(order.change_due) : undefined;

    printReceipt({
      ...order,
      cash_tendered: cash,
      change_due: change,
    });
  };

  if (loading) {
    return <div className="text-center py-12 italic text-gray-500">Loading history...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Orders History</h1>
      </div>

      {/* SCROLLABLE TABLE CONTAINER */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-700">#{order.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {order.customer
                        ? `${order.customer.first_name} ${order.customer.last_name}`
                        : <span className="text-gray-400 italic">Walk-in</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(order.id)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                        onClick={() => handlePrintReceipt(order)}
                      >
                        Print
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER / PAGINATION BAR */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-sm text-gray-500">
          <span>Showing {orders.length} orders</span>
        </div>
      </div>

      {/* Order Details Modal remains the same */}
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
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Order Number</p>
                <p className="font-bold text-lg text-blue-900">#{selectedOrder.order_number}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Date & Time</p>
                <p className="font-medium text-gray-800">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              {selectedOrder.customer && (
                <>
                  <div className="border-t border-blue-100 pt-2">
                    <p className="text-xs text-blue-600 font-bold uppercase">Customer</p>
                    <p className="font-medium">
                      {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}
                    </p>
                  </div>
                  {selectedOrder.customer.student_id && (
                    <div className="border-t border-blue-100 pt-2">
                      <p className="text-xs text-blue-600 font-bold uppercase">Student ID</p>
                      <p className="font-medium">{selectedOrder.customer.student_id}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-2">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                📦 Purchased Items
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.product?.name}
                        {item.product?.size && <span className="text-blue-600 font-normal ml-1">[{item.product.size}]</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} units @ {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t-2 border-dashed pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>

              {selectedOrder.cash_tendered != null && (
                <>
                  <div className="flex justify-between text-gray-600 italic">
                    <span>Cash Tendered</span>
                    <span>{formatCurrency(Number(selectedOrder.cash_tendered))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 italic">
                    <span>Change Due</span>
                    <span>{formatCurrency(Number(selectedOrder.change_due ?? 0))}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between font-black text-xl text-green-700 border-t pt-2">
                <span>TOTAL PAID</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                className="w-full sm:w-auto bg-[#0a318e] hover:bg-[#1e4eba]"
                onClick={() => handlePrintReceipt(selectedOrder)}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};