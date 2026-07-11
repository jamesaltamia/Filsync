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
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Generate comprehensive insights for your business</p>
        </div>
        {showActions && (
          <div className="flex gap-3 print:hidden">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all text-sm font-medium text-gray-700 dark:text-slate-200">
              🖨️ Print Report
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all text-sm font-medium">
              📊 Export CSV
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6 print:hidden transition-all duration-300 relative overflow-hidden">

        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        {/* Modern Tab Bar */}
        <div className="relative z-10 flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-100/80 dark:bg-slate-900/60 rounded-xl shadow-inner">
          {[
            { id: 'daily', label: 'Daily', icon: '📅' },
            { id: 'monthly', label: 'Monthly', icon: '📆' },
            { id: 'yearly', label: 'Yearly', icon: '🗓️' },
            { id: 'items', label: 'Item Sales', icon: '🛍️' },
            { id: 'credit', label: 'Credit Sales', icon: '💳' },
            { id: 'canteen', label: 'Canteen', icon: '🏪' },
            { id: 'water', label: 'Water Station', icon: '💧' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id as any)}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ease-out transform ${reportType === t.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <span className={reportType === t.id ? 'opacity-100' : 'opacity-70'}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Filters Toolbar */}
        <div className="relative z-10 flex flex-wrap items-end gap-5 bg-gray-50/50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-100 dark:border-slate-700/50">

          {reportType === 'daily' && (
            <div className="flex flex-col gap-1.5 group">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Select Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" />
            </div>
          )}

          {(reportType === 'monthly' || reportType === 'yearly') && (
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 group">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Year</label>
                <input type="number" value={year} onChange={e => setYear(+e.target.value)}
                  className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl w-28 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
              </div>
              {reportType === 'monthly' && (
                <div className="flex flex-col gap-1.5 group">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Month</label>
                  <input type="number" min={1} max={12} value={month} onChange={e => setMonth(+e.target.value)}
                    className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl w-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                </div>
              )}
            </div>
          )}

          {reportType === 'items' && (
            <>
              <div className="flex flex-col gap-1.5 group">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Category Filter</label>
                <select
                  value={itemSalesCategory || ''}
                  onChange={(e) => setItemSalesCategory(e.target.value ? Number(e.target.value) : null)}
                  className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl min-w-[200px] focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 group">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Specific Date</label>
                <input
                  type="date"
                  value={itemSalesDate}
                  onChange={(e) => setItemSalesDate(e.target.value)}
                  className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
            </>
          )}

          {reportType === 'canteen' && (
            <div className="flex flex-col gap-1.5 group">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Filter Location</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl min-w-[220px] focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              >
                <option value="All">🏢 All Locations</option>
                {CANTEEN_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'water' && (
            <>
              <div className="flex flex-col gap-1.5 group">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Period</label>
                <select
                  value={waterPeriod}
                  onChange={(e) => setWaterPeriod(e.target.value as any)}
                  className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {waterPeriod === 'daily' && (
                <div className="flex flex-col gap-1.5 group">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                </div>
              )}
              {(waterPeriod === 'monthly' || waterPeriod === 'yearly') && (
                <div className="flex flex-col gap-1.5 group">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Year</label>
                  <input type="number" value={year} onChange={e => setYear(+e.target.value)}
                    className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl w-28 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                </div>
              )}
              {waterPeriod === 'monthly' && (
                <div className="flex flex-col gap-1.5 group">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500 transition-colors">Month</label>
                  <input type="number" min={1} max={12} value={month} onChange={e => setMonth(+e.target.value)}
                    className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl w-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                </div>
              )}
            </>
          )}

          <div className="ml-auto">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-95'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating...
                </>
              ) : (
                <>✨ Generate Report</>
              )}
            </button>
          </div>
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
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Orders</p>
                <p className="text-4xl font-extrabold">{dailyData.total_orders || 0}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
                <p className="text-4xl font-extrabold">{formatCurrency(dailyData.total_revenue || 0)}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Unit Cost</p>
                <p className="text-4xl font-extrabold">{formatCurrency(dailyData.total_unit_cost || 0)}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Items Sold</p>
                <p className="text-4xl font-extrabold">{dailyData.total_items || 0}</p>
              </div>
            </div>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Products</p>
              <p className="text-4xl font-extrabold">{itemSales.length}</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-fuchsia-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Qty Sold</p>
              <p className="text-4xl font-extrabold">
                {itemSales.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0)}
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
              <p className="text-4xl font-extrabold">
                {formatCurrency(itemSales.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0))}
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Unit Cost</p>
              <p className="text-4xl font-extrabold">
                {formatCurrency(itemSales.reduce((sum, item) => sum + Number(item.total_unit_cost || 0), 0))}
              </p>
            </div>
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
          <div className="mt-8 mb-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Credit Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Credit Orders</p>
                <p className="text-4xl font-extrabold">{creditSales.length}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-rose-100 text-sm font-semibold uppercase tracking-wider mb-2">Outstanding Credit</p>
                <p className="text-4xl font-extrabold">
                  {formatCurrency(creditSales.filter((c) => c.status === 'Unpaid').reduce((sum, c) => sum + Number(c.total || 0), 0))}
                </p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-2">Paid Credit Revenue</p>
                <p className="text-4xl font-extrabold">
                  {formatCurrency(creditSales.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + Number(c.total || 0), 0))}
                </p>
              </div>
            </div>
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Paid Bills</p>
              <p className="text-4xl font-extrabold">
                {formatCurrency(
                  filteredCanteenBills
                    .filter(b => b.status === 'paid')
                    .reduce((s, b) => s + Number(b.amount), 0)
                )}
              </p>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-rose-100 text-sm font-semibold uppercase tracking-wider mb-2">Outstanding Bills</p>
              <p className="text-4xl font-extrabold">
                {formatCurrency(
                  filteredCanteenBills
                    .filter(b => b.status === 'unpaid')
                    .reduce((s, b) => s + Number(b.amount), 0)
                )}
              </p>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider mb-2">Occupied Stalls</p>
              <p className="text-4xl font-extrabold">
                {new Set(filteredCanteenBills.map(b => b.tenant?.stall?.id)).size}
              </p>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 mt-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border-l-4 border-blue-500">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">💰 Daily Sales</p>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(waterData.summary.daily_sales)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border-l-4 border-cyan-500">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">💧 Daily Gallons</p>
              <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{Number(waterData.summary.daily_gallons).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border-l-4 border-green-500">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">📅 Monthly Sales</p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{formatCurrency(waterData.summary.monthly_sales)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border-l-4 border-purple-500">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">📆 Yearly Sales</p>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{formatCurrency(waterData.summary.yearly_sales)}</p>
            </div>
          </div>

          {/* Filtered period totals */}
          <Card title={`Water Station Report — ${waterData.label}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Orders</p>
                <p className="text-4xl font-extrabold">{waterData.total_orders}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Sales</p>
                <p className="text-4xl font-extrabold">{formatCurrency(waterData.total_sales)}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <p className="text-cyan-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Gallons Sold</p>
                <p className="text-4xl font-extrabold">{Number(waterData.total_gallons).toFixed(2)} gal</p>
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