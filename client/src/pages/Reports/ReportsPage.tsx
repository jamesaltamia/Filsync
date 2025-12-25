import React, { useState, useRef, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { canteenService } from '../../services/canteenService';
import { orderService } from '../../services/orderService';
import type { DailySales, ItemSales, CreditSale } from '../../types/report';
import type { Bill } from '../../types/canteen';
import { formatCurrency } from '../../utils/formatCurrency';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] =
    useState<'daily' | 'monthly' | 'yearly' | 'items' | 'credit' | 'canteen'>('daily');

  const [dailyData, setDailyData] = useState<DailySales | null>(null);
  const [itemSales, setItemSales] = useState<ItemSales[]>([]);
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [canteenBills, setCanteenBills] = useState<Bill[]>([]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  /* ---------------- RESET DATA ON TAB CHANGE ---------------- */
  useEffect(() => {
    setDailyData(null);
    setItemSales([]);
    setCreditSales([]);
    setCanteenBills([]);
  }, [reportType]);

  /* ---------------- FETCHERS ---------------- */
  const fetchDaily = async () => {
    setLoading(true);
    try {
      setDailyData(await reportService.getDailySales(date));
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      setDailyData(await reportService.getMonthlySales(year, month));
    } finally {
      setLoading(false);
    }
  };

  const fetchYearly = async () => {
    setLoading(true);
    try {
      setDailyData(await reportService.getYearlySales(year));
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      setItemSales(await reportService.getItemSales());
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditSales = async () => {
    setLoading(true);
    try {
      setCreditSales(await reportService.getCreditSales());
    } finally {
      setLoading(false);
    }
  };

  const fetchCanteen = async () => {
    setLoading(true);
    try {
      setCanteenBills(await canteenService.getBills());
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (reportType === 'daily') fetchDaily();
    else if (reportType === 'monthly') fetchMonthly();
    else if (reportType === 'yearly') fetchYearly();
    else if (reportType === 'items') fetchItems();
    else if (reportType === 'credit') fetchCreditSales();
    else fetchCanteen();
  };

  const handlePrint = () => window.print();

  /* ---------------- EXPORT CSV ---------------- */
  const handleExportCSV = () => {
    let csv = '';
    let filename = '';

    if (reportType === 'items') {
      csv = 'Product,Category,Quantity,Revenue\n';
      itemSales.forEach(i => {
        csv += `"${i.product.name}","${i.product.category?.name}",${i.total_quantity},${i.total_revenue}\n`;
      });
      filename = 'item-sales.csv';
    }

    else if (reportType === 'credit') {
      csv = 'Teacher,Total Credit\n';
      creditSales.forEach(c => {
        csv += `"${c.teacher_name}",${c.total}\n`;
      });
      filename = 'credit-sales.csv';
    }

    else if (reportType === 'canteen') {
      csv = 'Tenant,Stall,Month,Status,Amount\n';
      canteenBills.forEach(b => {
        csv += `"${b.tenant?.name}","${b.tenant?.stall?.name}","${b.month_year}","${b.status}",${b.amount}\n`;
      });
      filename = 'canteen-report.csv';
    }

    else if (dailyData) {
      csv =
        `Metric,Value\n` +
        `Total Orders,${dailyData.total_orders}\n` +
        `Total Revenue,${dailyData.total_revenue}\n`;
      filename = `${reportType}-sales.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const showActions =
    dailyData ||
    itemSales.length > 0 ||
    creditSales.length > 0 ||
    canteenBills.length > 0;

  const getReportTitle = () => {
    if (reportType === 'daily') {
      return `Daily Sales Report - ${date}`;
    }

    if (reportType === 'monthly') {
      return `Monthly Sales Report - ${new Date(
        year,
        month - 1
      ).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    }

    if (reportType === 'yearly') {
      return `Yearly Sales Report - ${year}`;
    }

    if (reportType === 'items') {
      return 'Item Sales Report';
    }

    if (reportType === 'credit') {
      return 'Credit Sales Report (Teachers)';
    }

    return 'Canteen Revenue Report';
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        {showActions && (
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline">🖨️ Print Report</Button>
            <Button onClick={handleExportCSV} variant="outline">📊 Export CSV</Button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="bg-white rounded-lg shadow-md p-6 print:hidden">
        <div className="flex flex-wrap gap-2 mb-4">
          {['daily', 'monthly', 'yearly', 'items', 'credit', 'canteen'].map(t => (
            <button
              key={t}
              onClick={() => setReportType(t as any)}
              className={`px-4 py-2 rounded-lg ${reportType === t ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}
            >
              {t === 'items' ? 'Item Sales' :
                t === 'credit' ? 'Credit Sales (Teachers)' :
                  t === 'canteen' ? 'Canteen' : t}
            </button>
          ))}
        </div>

        {reportType === 'daily' && (
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border px-4 py-2 rounded-lg" />
        )}

        {(reportType === 'monthly' || reportType === 'yearly') && (
          <div className="flex gap-2">
            <input type="number" value={year} onChange={e => setYear(+e.target.value)}
              className="border px-4 py-2 rounded-lg" />
            {reportType === 'monthly' && (
              <input type="number" min={1} max={12} value={month}
                onChange={e => setMonth(+e.target.value)}
                className="border px-4 py-2 rounded-lg" />
            )}
          </div>
        )}

        <Button onClick={handleGenerateReport} isLoading={loading} className="mt-4">
          Generate Report
        </Button>
      </div>

      {dailyData && reportType !== 'items' && reportType !== 'credit' && (
        <div ref={printRef}>
          {/* Print Header */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
            <hr className="my-4" />
          </div>

          {/* Summary Cards */}
          <Card title="Sales Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{dailyData.total_orders || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(dailyData.total_revenue || 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Subtotal</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(dailyData.total_subtotal || 0)}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Tax Amount</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(dailyData.total_tax || 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {reportType === 'items' && itemSales.length > 0 && (
        <div ref={printRef} className="space-y-6">
          {/* Print Header */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
            <hr className="my-4" />
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{itemSales.length}</p>
            </Card>
            <Card>
              <p className="text-gray-600 text-sm font-medium">Total Quantity Sold</p>
              <p className="text-2xl font-bold text-purple-600">
                {itemSales.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0)}
              </p>
            </Card>
            <Card>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(itemSales.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0))}
              </p>
            </Card>
          </div>

          <Card title="Item Sales Report">
            <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
              {/* Scrollable Container */}
              <div className="overflow-y-auto max-h-[400px]"> {/* Adjust height as needed */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10"> {/* Sticky Header */}
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Qty Sold</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {itemSales.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{item.product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.product.category?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">{item.total_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                          {formatCurrency(item.total_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sticky Total Row */}
              <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 z-20">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <div className="flex-1 text-right pr-[22%]">TOTAL:</div>
                  <div className="w-24 text-center">
                    {itemSales.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0)}
                  </div>
                  <div className="w-32 text-right text-green-600">
                    {formatCurrency(itemSales.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Credit Sales Report */}
      {reportType === 'credit' && (
        <div ref={printRef}>
          {/* Print Header */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
            <hr className="my-4" />
          </div>

          <Card title="Credit Sales Summary (Teachers)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Credit Orders</p>
                <p className="text-2xl font-bold text-blue-600">{creditSales.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Outstanding Credit</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    creditSales
                      .filter((c) => c.status === 'Unpaid')
                      .reduce((sum, c) => sum + Number(c.total || 0), 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Paid Credit Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    creditSales
                      .filter((c) => c.status === 'Paid')
                      .reduce((sum, c) => sum + Number(c.total || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Credit Sales (Teachers)">
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{sale.order_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{sale.teacher_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{sale.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${sale.status === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.status === 'Unpaid' ? (
                          <button
                            type="button"
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            onClick={async () => {
                              if (
                                !confirm(
                                  `Mark order ${sale.order_number} as paid?`
                                )
                              ) {
                                return;
                              }
                              try {
                                await orderService.markAsPaid(sale.id);
                                // Refresh credit sales list
                                fetchCreditSales();
                              } catch (error) {
                                // eslint-disable-next-line no-console
                                console.error('Error marking order as paid:', error);
                                alert('Failed to mark order as paid. Please try again.');
                              }
                            }}
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {creditSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No credit sales found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================= CANTEEN REPORT ================= */}
      {reportType === 'canteen' && canteenBills.length > 0 && (
        <div ref={printRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-sm text-gray-600">Total Paid Bills</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  canteenBills.filter(b => b.status === 'paid')
                    .reduce((s, b) => s + Number(b.amount), 0)
                )}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-600">Outstanding Bills</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  canteenBills.filter(b => b.status === 'unpaid')
                    .reduce((s, b) => s + Number(b.amount), 0)
                )}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-600">Occupied Stalls</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(canteenBills.map(b => b.tenant?.stall?.id)).size}
              </p>
            </Card>
          </div>

          <Card title="Canteen Billing Details">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium">Stall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {canteenBills.map(b => (
                  <tr key={b.id}>
                    <td className="px-6 py-4">{b.tenant?.name}</td>
                    <td className="px-6 py-4">{b.tenant?.stall?.name}</td>
                    <td className="px-6 py-4">{b.month_year}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${b.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(Number(b.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};
