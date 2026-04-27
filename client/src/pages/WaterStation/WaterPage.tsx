import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IconDroplet,
  IconCurrencyDollar,
  IconChartBar,
  IconCalendarEvent,
  IconReportMoney,
  IconCheck,
  IconTrendingUp
} from '@tabler/icons-react';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import api from '../../services/api';

interface DashboardStats {
  dailySales: number;
  dailyGallons: number;
  monthlySales: number;
  yearlySales: number;
  yearlyGallons: number;
}

interface ChartData {
  date: string;
  sales: number;
  gallons: number;
}

export const WaterPage: React.FC = () => {
  const [gallons, setGallons] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [price, setPrice] = useState<number | ''>('');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // gallon equivalent
  const totalGallons =
    gallons && quantity
      ? (Number(gallons) / 3.78) * Number(quantity)
      : 0;

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/water/dashboard');
      setStats(response.data.stats);
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gallons || !quantity || price === '') return;

    setSubmitting(true);
    setSuccessMsg('');

    try {
      await api.post('/water/transactions', {
        gallons: Number(gallons),
        quantity: Number(quantity),
        price: Number(price)
      });

      setSuccessMsg('Transaction saved successfully!');

      setGallons('');
      setQuantity(1);
      setPrice('');

      fetchDashboard();

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Water Refilling Station
        </h1>

        <p className="text-slate-500 dark:text-slate-400">
          Track and manage water sales and refills
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT FORM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
              <IconDroplet size={22} />
            </div>

            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              New Transaction
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Container Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Container Size (Liters)
              </label>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={gallons}
                  onChange={(e) =>
                    setGallons(
                      e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 3.78"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                />

                <IconDroplet
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Open input for any container size
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantity
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 5"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                />

                <IconChartBar
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
              </div>
            </div>

            {/* Editable Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Price (₱)
              </label>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                    )
                  }
                  placeholder="Enter total price"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white text-lg font-semibold text-blue-600 outline-none"
                />

                <IconCurrencyDollar
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Cashier can edit price every transaction
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Gallons Equivalent:
                </span>

                <span className="font-semibold text-slate-700 dark:text-white">
                  {totalGallons.toFixed(2)} gal
                </span>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
            >
              {submitting ? 'Processing...' : 'Record Transaction'}
            </button>

            {/* Success */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg"
              >
                <IconCheck size={18} />
                <span className="text-sm">{successMsg}</span>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Daily Sales"
              value={`₱${Number(stats?.dailySales || 0).toFixed(2)}`}
              icon={<IconReportMoney size={22} />}
              color="text-emerald-600"
              bgColor="bg-emerald-100"
            />

            <StatCard
              title="Daily Gallons"
              value={`${Number(stats?.dailyGallons || 0).toFixed(2)} gal`}
              icon={<IconDroplet size={22} />}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />

            <StatCard
              title="Monthly Sales"
              value={`₱${Number(stats?.monthlySales || 0).toFixed(2)}`}
              icon={<IconCalendarEvent size={22} />}
              color="text-indigo-600"
              bgColor="bg-indigo-100"
            />

            <StatCard
              title="Yearly Sales"
              value={`₱${Number(stats?.yearlySales || 0).toFixed(2)}`}
              icon={<IconTrendingUp size={22} />}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">
                Sales - Last 7 Days
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3b82f6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">
                Gallons Sold - Last 7 Days
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="gallons" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">
          Loading dashboard...
        </p>
      )}
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
  bgColor
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>

      <h3 className="text-sm text-slate-500">{title}</h3>
    </div>

    <p className="text-2xl font-bold text-slate-800 dark:text-white">
      {value}
    </p>
  </motion.div>
);