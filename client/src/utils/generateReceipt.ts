import type { Order } from '../types/order';
import { formatCurrency } from './formatCurrency';

export const generateReceipt = (order: Order): string => {
  const paymentLine =
    order.payment_method === 'credit'
      ? order.status === 'pending'
        ? 'ON ACCOUNT (UNPAID)'
        : 'ON ACCOUNT (PAID)'
      : order.payment_method.toUpperCase();

  const cashLine =
    typeof order.cash_tendered === 'number'
      ? `Cash: ${formatCurrency(order.cash_tendered)}`
      : '';

  const changeLine =
    typeof order.change_due === 'number'
      ? `Change: ${formatCurrency(order.change_due)}`
      : '';

  const receipt = `
==========================================
                 RECEIPT
               FilSync POS
==========================================
Order #: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleString()}
${order.customer ? `Customer: ${order.customer.full_name || `${order.customer.first_name} ${order.customer.last_name}`}` : ''}
${order.customer?.student_id ? `ID: ${order.customer.student_id}` : ''}
------------------------------------------
ITEMS:
${order.items?.map(item => {
  const productName = item.product?.name || 'Product';
  const size = item.product?.size ? ` (${item.product.size})` : '';
  return `${productName}${size} x${item.quantity} @ ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`;
}).join('\n') || ''}
------------------------------------------
TOTAL: ${formatCurrency(order.total)}
${cashLine}
${changeLine}
Payment: ${paymentLine}
==========================================
        Thank you for your purchase!
==========================================
  `.trim();

  return receipt;
};

export const printReceipt = (order: Order) => {
  const receipt = generateReceipt(order);
  
  // 1. Create a hidden iframe
  const iframe = document.createElement('iframe');
  
  // 2. Hide the iframe visually but keep it in the DOM
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);

  // 3. Write content to the iframe
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              white-space: pre-wrap;
              font-size: 12px; /* Adjust size for thermal printers */
            }
            @media print {
              @page { margin: 0; }
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>${receipt.replace(/\n/g, '<br>')}</body>
      </html>
    `);
    doc.close();

    // 4. Trigger the print dialog on the iframe window
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }

  // 5. Clean up: Remove the iframe after a short delay
  // We use a timeout to ensure the print dialog has time to initialize
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
};