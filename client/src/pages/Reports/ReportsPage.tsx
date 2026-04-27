import React, { useState, useRef, useEffect, useMemo } from 'react';
import { reportService } from '../../services/reportService';
import { canteenService } from '../../services/canteenService';
import { orderService } from '../../services/orderService';
import { categoryService } from '../../services/inventoryService';
import type { DailySales, ItemSales, CreditSale } from '../../types/report';
import type { Bill } from '../../types/canteen';
import type { Category } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

// CONSTANTS
const CANTEEN_LOCATIONS = ['Main Canteen', 'High School Canteen'];

export const ReportsPage: React.FC = () => {
  // --- STATES ---
  const [reportType, setReportType] =
    useState<'daily' | 'monthly' | 'yearly' | 'items' | 'credit' | 'canteen' | 'water'>('daily');

  const [dailyData, setDailyData] = useState<DailySales | null>(null);
  const [itemSales, setItemSales] = useState<ItemSales[]>([]);
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [canteenBills, setCanteenBills] = useState<Bill[]>([]);
  const [waterData, setWaterData] = useState<any>(null);
  const [waterPeriod, setWaterPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // NEW: Filter State for Canteen
  const [filterLocation, setFilterLocation] = useState<string>('All');

  // NEW: Filter State for Item Sales
  const [itemSalesCategory, setItemSalesCategory] = useState<number | null>(null);
  const [itemSalesDate, setItemSalesDate] = useState<string>('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDailyData(null);
    setItemSales([]);
    setCreditSales([]);
    setCanteenBills([]);
    setWaterData(null);
    setFilterLocation('All');
    setItemSalesCategory(null);
    setItemSalesDate('');
  }, [reportType]);

  useEffect(() => {
    // Fetch categories for Item Sales filter
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  /* ---------------- DATA FETCHING ---------------- */
  const fetchDaily = async () => {
    setLoading(true);
    try { setDailyData(await reportService.getDailySales(date)); } finally { setLoading(false); }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try { setDailyData(await reportService.getMonthlySales(year, month)); } finally { setLoading(false); }
  };

  const fetchYearly = async () => {
    setLoading(true);
    try { setDailyData(await reportService.getYearlySales(year)); } finally { setLoading(false); }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const startDate = itemSalesDate || undefined;
      const endDate = itemSalesDate || undefined; // Use same date for both if filtering by single date
      const categoryId = itemSalesCategory || undefined;
      setItemSales(await reportService.getItemSales(startDate, endDate, categoryId));
    } finally { setLoading(false); }
  };

  const fetchCreditSales = async () => {
    setLoading(true);
    try { setCreditSales(await reportService.getCreditSales()); } finally { setLoading(false); }
  };

  const fetchCanteen = async () => {
    setLoading(true);
    try { setCanteenBills(await canteenService.getBills()); } finally { setLoading(false); }
  };

  const fetchWater = async () => {
    setLoading(true);
    try {
      const data = await reportService.getWaterReport(
        waterPeriod,
        year,
        month,
        date
      );
      setWaterData(data);
    } finally { setLoading(false); }
  };

  const handleGenerateReport = () => {
    if (reportType === 'daily') fetchDaily();
    else if (reportType === 'monthly') fetchMonthly();
    else if (reportType === 'yearly') fetchYearly();
    else if (reportType === 'items') fetchItems();
    else if (reportType === 'credit') fetchCreditSales();
    else if (reportType === 'water') fetchWater();
    else fetchCanteen();
  };

  const handlePrint = () => window.print();

  // --- COMPUTED DATA (Filtering) ---
  const filteredCanteenBills = useMemo(() => {
    if (reportType !== 'canteen') return [];
    if (filterLocation === 'All') return canteenBills;
    // Filter based on the bill's stall location
    return canteenBills.filter(b => b.tenant?.stall?.location === filterLocation);
  }, [canteenBills, filterLocation, reportType]);

  /* ---------------- EXPORT CSV ---------------- */
  const handleExportCSV = () => {
    let csv = '';
    let filename = '';

    // Helper to format numbers with commas and wrap in quotes for CSV safety
    const fNum = (num: number | string) => {
      const formatted = Number(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `"${formatted}"`;
    };

    if (reportType === 'items') {
      csv = 'Product,Category,Quantity,Unit Price,Revenue,Total Unit Cost\n';
      itemSales.forEach(i => {
        csv += `"${i.product.name}","${i.product.category?.name || 'N/A'}",${i.total_quantity},${fNum(i.product.unit_price || 0)},${fNum(i.total_revenue)},${fNum(i.total_unit_cost)}\n`;
      });
      filename = 'item-sales.csv';
    }

    else if (reportType === 'credit') {
      csv = 'Teacher,Total Credit\n';
      creditSales.forEach(c => {
        csv += `"${c.teacher_name}",${fNum(c.total)}\n`;
      });
      filename = 'credit-sales.csv';
    }

    else if (reportType === 'canteen') {
      csv = 'Tenant,Stall,Location,Month,Status,Amount\n';
      filteredCanteenBills.forEach(b => {
        csv += `"${b.tenant?.name}","${b.tenant?.stall?.name}","${b.tenant?.stall?.location}","${b.month_year}","${b.status}",${fNum(b.amount)}\n`;
      });
      filename = `canteen-report-${filterLocation === 'All' ? 'all' : filterLocation.toLowerCase().replace(/\s/g, '-')}.csv`;
    }

    else if (reportType === 'water' && waterData) {
      csv = 'Date,Container Size (L),Quantity,Total Gallons,Total Price\n';
      waterData.transactions.forEach((t: any) => {
        const d = new Date(t.created_at).toLocaleDateString();
        csv += `"${d}",${t.gallons},${t.quantity},${fNum(t.total_gallons)},${fNum(t.price)}\n`;
      });
      filename = `water-station-${waterData.label}.csv`;
    }

    else if (dailyData) {
      csv =
        `Metric,Value\n` +
        `Total Orders,${dailyData.total_orders}\n` +
        `Total Revenue,${fNum(dailyData.total_revenue)}\n` +
        `Total Unit Cost,${fNum(dailyData.total_unit_cost || 0)}\n` +
        `Total Items Sold,${dailyData.total_items || 0}\n`;
      filename = `${reportType}-sales.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const showActions =
    dailyData ||
    itemSales.length > 0 ||
    creditSales.length > 0 ||
    canteenBills.length > 0 ||
    waterData;

  const getReportTitle = () => {
    if (reportType === 'daily') return `Daily Sales Report - ${date}`;
    if (reportType === 'monthly') return `Monthly Sales Report - ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    if (reportType === 'yearly') return `Yearly Sales Report - ${year}`;
    if (reportType === 'items') return 'Item Sales Report';
    if (reportType === 'credit') return 'Credit Sales Report (Teachers)';
    if (reportType === 'canteen') return `Canteen Report (${filterLocation})`;
    if (reportType === 'water' && waterData) return `Water Station Report - ${waterData.label}`;
    return 'Report';
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Reports</h1>
        {showActions && (
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline">🖨️ Print Report</Button>
            <Button onClick={handleExportCSV} variant="outline">📊 Export CSV</Button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 print:hidden">
        <div className="flex flex-wrap gap-2 mb-4">
          {['daily', 'monthly', 'yearly', 'items', 'credit', 'canteen', 'water'].map(t => (
            <button
              key={t}
              onClick={() => setReportType(t as any)}
              className={`px-4 py-2 rounded-lg ${reportType === t ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-slate-300'}`}
            >
              {t === 'items' ? 'Item Sales' :
                t === 'credit' ? 'Credit Sales (Teachers)' :
                  t === 'canteen' ? 'Canteen' :
                    t === 'water' ? 'Water Station' :
                      t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {reportType === 'daily' && (
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg" />
          )}

          {(reportType === 'monthly' || reportType === 'yearly') && (
            <div className="flex gap-2">
              <input type="number" value={year} onChange={e => setYear(+e.target.value)}
                className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg" />
              {reportType === 'monthly' && (
                <input type="number" min={1} max={12} value={month}
                  onChange={e => setMonth(+e.target.value)}
                  className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg" />
              )}
            </div>
          )}

          {/* NEW: Item Sales Filters */}
          {reportType === 'items' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Category</label>
                <select
                  value={itemSalesCategory || ''}
                  onChange={(e) => setItemSalesCategory(e.target.value ? Number(e.target.value) : null)}
                  className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg min-w-[200px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Date</label>
                <input
                  type="date"
                  value={itemSalesDate}
                  onChange={(e) => setItemSalesDate(e.target.value)}
                  className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg"
                />
              </div>
            </>
          )}

          {/* Canteen Location Filter */}
          {reportType === 'canteen' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Filter Location</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg min-w-[200px]"
              >
                <option value="All">All Locations</option>
                {CANTEEN_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          {/* Water Station Period Filter */}
          {reportType === 'water' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Period</label>
                <select
                  value={waterPeriod}
                  onChange={(e) => setWaterPeriod(e.target.value as any)}
                  className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {waterPeriod === 'daily' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg" />
                </div>
              )}
              {(waterPeriod === 'monthly' || waterPeriod === 'yearly') && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Year</label>
                  <input type="number" value={year} onChange={e => setYear(+e.target.value)}
                    className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg w-28" />
                </div>
              )}
              {waterPeriod === 'monthly' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">Month</label>
                  <input type="number" min={1} max={12} value={month} onChange={e => setMonth(+e.target.value)}
                    className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg w-24" />
                </div>
              )}
            </>
          )}

          <Button onClick={handleGenerateReport} isLoading={loading}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* --- REPORT VIEW: DAILY / MONTHLY / YEARLY --- */}
      {dailyData && reportType !== 'items' && reportType !== 'credit' && reportType !== 'canteen' && (
        <div ref={printRef}>
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
            <hr className="my-4" />
          </div>
          <Card title="Sales Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{dailyData.total_orders || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(dailyData.total_revenue || 0)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Total Unit Cost</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(dailyData.total_unit_cost || 0)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-gray-700 text-sm font-medium mb-1">Total Items Sold</p>
                <p className="text-3xl font-bold text-yellow-600">{dailyData.total_items || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- REPORT VIEW: ITEMS --- */}
      {reportType === 'items' && itemSales.length > 0 && (
        <div ref={printRef} className="space-y-6">
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <hr className="my-4" />
          </div>
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
            <Card>
              <p className="text-gray-600 text-sm font-medium">Total Unit Cost</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(itemSales.reduce((sum, item) => sum + Number(item.total_unit_cost || 0), 0))}
              </p>
            </Card>
          </div>
          <Card title="Item Sales Report">
            <div className="flex flex-col border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-y-auto max-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Category</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Qty Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Unit Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {itemSales.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">{item.product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-slate-400">{item.product.category?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">{item.total_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 dark:text-slate-400">
                          {item.product.unit_price ? formatCurrency(item.product.unit_price) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.total_revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(item.total_unit_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- REPORT VIEW: CREDIT --- */}
      {reportType === 'credit' && (
        <div ref={printRef}>
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <hr className="my-4" />
          </div>
          <Card title="Credit Sales Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Credit Orders</p>
                <p className="text-2xl font-bold text-blue-600">{creditSales.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Outstanding Credit</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(creditSales.filter((c) => c.status === 'Unpaid').reduce((sum, c) => sum + Number(c.total || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Paid Credit Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(creditSales.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + Number(c.total || 0), 0))}
                </p>
              </div>
            </div>
          </Card>
          <Card title="Credit Orders List">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {creditSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4">{sale.order_number}</td>
                      <td className="px-6 py-4">{sale.teacher_name}</td>
                      <td className="px-6 py-4">{sale.date}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(sale.total)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${sale.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{sale.status}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sale.status === 'Unpaid' && (
                          <button
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            onClick={async () => {
                              if (confirm("Mark as paid?")) {
                                await orderService.markAsPaid(sale.id);
                                fetchCreditSales();
                              }
                            }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- REPORT VIEW: CANTEEN (UPDATED WITH FILTER) --- */}
      {reportType === 'canteen' && filteredCanteenBills.length > 0 && (
        <div ref={printRef}>
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
            <hr className="my-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-sm text-gray-600">Total Paid Bills</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredCanteenBills
                    .filter(b => b.status === 'paid')
                    .reduce((s, b) => s + Number(b.amount), 0)
                )}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-600">Outstanding Bills</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  filteredCanteenBills
                    .filter(b => b.status === 'unpaid')
                    .reduce((s, b) => s + Number(b.amount), 0)
                )}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-600">Occupied Stalls</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(filteredCanteenBills.map(b => b.tenant?.stall?.id)).size}
              </p>
            </Card>
          </div>

          <Card title={`Canteen Billing Details (${filterLocation})`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Stall</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Month</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredCanteenBills.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-200">{b.tenant?.name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{b.tenant?.stall?.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-500">{b.tenant?.stall?.location}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{b.month_year}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${b.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-700 dark:text-slate-300">
                        {formatCurrency(Number(b.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State for Canteen if no data matches filter */}
      {reportType === 'canteen' && filteredCanteenBills.length === 0 && canteenBills.length > 0 && (
        <div className="text-center py-10 bg-white rounded-lg border">
          <p className="text-gray-500">No records found for {filterLocation}.</p>
        </div>
      )}

      {/* --- REPORT VIEW: WATER STATION --- */}
      {reportType === 'water' && waterData && (
        <div ref={printRef} className="space-y-6">
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">FilSync POS</h1>
            <h2 className="text-xl font-semibold mb-2">{getReportTitle()}</h2>
            <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
            <hr className="my-4" />
          </div>

          {/* Always-on summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">💰 Daily Sales</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(waterData.summary.daily_sales)}</p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-700">
              <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">💧 Daily Gallons</p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{Number(waterData.summary.daily_gallons).toFixed(2)} gal</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">📅 Monthly Sales</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(waterData.summary.monthly_sales)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">📆 Yearly Sales</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(waterData.summary.yearly_sales)}</p>
            </div>
          </div>

          {/* Filtered period totals */}
          <Card title={`Water Station Report — ${waterData.label}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{waterData.total_orders}</p>
              </div>
              <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Total Sales</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(waterData.total_sales)}</p>
              </div>
              <div className="bg-cyan-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Total Gallons Sold</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{Number(waterData.total_gallons).toFixed(2)} gal</p>
              </div>
            </div>

            {waterData.transactions.length > 0 ? (
              <div className="flex flex-col border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-[400px]">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Date &amp; Time</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Container (L)</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Qty</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Gallons</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {waterData.transactions.map((t: any, i: number) => (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-6 py-3 text-gray-400 text-sm">{i + 1}</td>
                          <td className="px-6 py-3 text-gray-700 dark:text-slate-300 text-sm">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="px-6 py-3 text-center font-medium dark:text-slate-200">{t.gallons} L</td>
                          <td className="px-6 py-3 text-center dark:text-slate-200">{t.quantity}</td>
                          <td className="px-6 py-3 text-center text-cyan-600 dark:text-cyan-400 font-semibold">{Number(t.total_gallons).toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(t.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400">No transactions found for this period.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};