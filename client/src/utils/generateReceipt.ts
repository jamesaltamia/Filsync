import type { Order } from '../types/order';
import { formatCurrency } from './formatCurrency';

export const generateReceipt = (order: Order): string => {
  const paymentLine =
    order.payment_method === 'credit'
      ? order.status === 'pending'
        ? 'ON ACCOUNT (UNPAID)'
        : 'ON ACCOUNT (PAID)'
      : order.payment_method.toUpperCase();

  const receipt = `
================================
        RECEIPT
================================
Order #: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleString()}
${order.customer ? `Customer: ${order.customer.full_name || `${order.customer.first_name} ${order.customer.last_name}`}` : ''}
${order.customer?.student_id ? `ID: ${order.customer.student_id}` : ''}
--------------------------------
ITEMS:
${order.items?.map(item => 
  `${item.product?.name || 'Product'} x${item.quantity} @ ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`
).join('\n') || ''}
--------------------------------
TOTAL: ${formatCurrency(order.total)}
Payment: ${paymentLine}
================================
Thank you for your purchase!
================================
  `.trim();

  return receipt;
};

export const printReceipt = (order: Order) => {
  const receipt = generateReceipt(order);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${receipt.replace(/\n/g, '<br>')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

