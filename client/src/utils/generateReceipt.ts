import type { Order } from '../types/order';
import { formatCurrency } from './formatCurrency';

export interface ReceiptSettings {
  receipt_header_text?: string;
  receipt_footer_text?: string;
  receipt_show_store_info?: boolean;
  receipt_show_customer_info?: boolean;
}

export const generateReceipt = (order: Order, settings?: ReceiptSettings): string => {
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

  const headerText = settings?.receipt_show_store_info !== false 
    ? (settings?.receipt_header_text || 'Filamer Christian University Enterprise')
    : '';

  const customerBlock = settings?.receipt_show_customer_info !== false
    ? `${order.customer ? `Customer: ${order.customer.full_name || `${order.customer.first_name} ${order.customer.last_name}`}` : ''}\n${order.customer?.student_id ? `ID: ${order.customer.student_id}` : ''}`
    : '';

  const receipt = `
==========================================
                 RECEIPT
  ${headerText}
==========================================
Order #: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleString()}
${customerBlock}
------------------------------------------
ITEMS:
${order.items?.map(item => {
    const productName = item.product?.name || 'Product';
    const size = item.product?.size ? ` (${item.product.size})` : '';
    return `${productName}${size} x${item.quantity} @ ${formatCurrency(item.price)} 
    Total = ${formatCurrency(item.subtotal)}`;
  }).join('\n') || ''}
------------------------------------------
TOTAL: ${formatCurrency(order.total)}
${cashLine}
${changeLine}
Payment: ${paymentLine}
==========================================
        ${settings?.receipt_footer_text || 'Thank you for your purchase!'}
==========================================
  `.trim();

  return receipt;
};

export const printReceipt = (order: Order, settings?: ReceiptSettings) => {
  const receipt = generateReceipt(order, settings);

  const iframe = document.createElement('iframe');

  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

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

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
};