import React, { useState } from 'react';
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{dailyData.total_orders || 0}</p>
          </Card>
          <Card>
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dailyData.total_revenue || 0)}
            </p>
          </Card>
          <Card>
            <p className="text-gray-600 text-sm">Subtotal</p>
            <p className="text-2xl font-bold">{formatCurrency(dailyData.total_subtotal || 0)}</p>
          </Card>
          <Card>
            <p className="text-gray-600 text-sm">Tax</p>
            <p className="text-2xl font-bold">{formatCurrency(dailyData.total_tax || 0)}</p>
          </Card>
        </div>
      )}

      {reportType === 'items' && itemSales.length > 0 && (
        <Card title="Item Sales Report">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemSales.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.product.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.total_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatCurrency(item.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

