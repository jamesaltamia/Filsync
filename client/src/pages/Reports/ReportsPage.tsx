import React, { useState, useRef } from 'react';
import { reportService } from '../../services/reportService';
import type { DailySales, ItemSales } from '../../types/report';
import { formatCurrency } from '../../utils/formatCurrency';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly' | 'items'>('daily');
  const [dailyData, setDailyData] = useState<DailySales | null>(null);
  const [itemSales, setItemSales] = useState<ItemSales[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getDailySales(date);
      setDailyData(data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getMonthlySales(year, month);
      setDailyData(data);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getYearlySales(year);
      setDailyData(data);
    } catch (error) {
      console.error('Error fetching yearly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemSales = async () => {
    setLoading(true);
    try {
      const data = await reportService.getItemSales();
      setItemSales(data);
    } catch (error) {
      console.error('Error fetching item sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (reportType === 'daily') {
      fetchDailyReport();
    } else if (reportType === 'monthly') {
      fetchMonthlyReport();
    } else if (reportType === 'yearly') {
      fetchYearlyReport();
    } else {
      fetchItemSales();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'items' && itemSales.length > 0) {
      // Export Item Sales
      csvContent = 'Product,Category,Quantity Sold,Revenue\n';
      itemSales.forEach((item) => {
        csvContent += `"${item.product.name}","${item.product.category?.name || 'N/A'}",${item.total_quantity},${item.total_revenue}\n`;
      });
      filename = 'item-sales-report.csv';
    } else if (dailyData) {
      // Export Summary
      const reportPeriod = reportType === 'daily' ? date : 
                          reportType === 'monthly' ? `${year}-${String(month).padStart(2, '0')}` : 
                          `${year}`;
      csvContent = `${reportType.toUpperCase()} SALES REPORT - ${reportPeriod}\n\n`;
      csvContent += 'Metric,Value\n';
      csvContent += `Total Orders,${dailyData.total_orders || 0}\n`;
      csvContent += `Total Revenue,${dailyData.total_revenue || 0}\n`;
      csvContent += `Subtotal,${dailyData.total_subtotal || 0}\n`;
      csvContent += `Tax,${dailyData.total_tax || 0}\n`;
      filename = `${reportType}-sales-report-${reportPeriod}.csv`;
    }

    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReportTitle = () => {
    if (reportType === 'daily') return `Daily Sales Report - ${date}`;
    if (reportType === 'monthly') return `Monthly Sales Report - ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    if (reportType === 'yearly') return `Yearly Sales Report - ${year}`;
    return 'Item Sales Report';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        {(dailyData || itemSales.length > 0) && (
          <div className="flex space-x-2 print:hidden">
            <Button onClick={handlePrint} variant="outline">
              🖨️ Print Report
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              📊 Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 print:hidden">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'daily' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'monthly' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setReportType('yearly')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'yearly' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setReportType('items')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'items' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Item Sales
          </button>
        </div>

        {/* Date/Year Selection */}
        {reportType === 'daily' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {(reportType === 'monthly' || reportType === 'yearly') && (
          <div className="mb-4 flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {reportType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        <Button onClick={handleGenerateReport} isLoading={loading}>
          Generate Report
        </Button>
      </div>

      {/* Report Results */}
      {dailyData && reportType !== 'items' && (
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
        <div ref={printRef}>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemSales.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{item.product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.product.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{item.total_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        {formatCurrency(item.total_revenue)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="px-6 py-4 text-right">TOTAL:</td>
                    <td className="px-6 py-4 text-center">
                      {itemSales.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0)}
                    </td>
                    <td className="px-6 py-4 text-green-600">
                      {formatCurrency(itemSales.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

