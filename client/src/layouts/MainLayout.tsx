import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import LogoImg from '../assets/Filamer.png';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  IconLayoutDashboard,
  IconBox,
  IconShoppingCart,
  IconClipboardList,
  IconBuildingStore,
  IconDroplet,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconBuildingWarehouse,
  IconShoppingBag,
} from '@tabler/icons-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname === '/inventory' || location.pathname === '/stock-room'
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allNavigationItems = [
    { name: 'Dashboard', path: '/', icon: <IconLayoutDashboard size={22} stroke={1.5} />, roles: ['admin', 'cashier'] },
    { name: 'Inventory', path: '/inventory', icon: <IconBox size={22} stroke={1.5} />, roles: ['admin'] },
    { name: 'Sales', path: '/sales', icon: <IconShoppingCart size={22} stroke={1.5} />, roles: ['admin', 'cashier'] },
    { name: 'Orders History', path: '/orders', icon: <IconClipboardList size={22} stroke={1.5} />, roles: ['admin', 'cashier'] },
    { name: 'Canteen', path: '/canteen', icon: <IconBuildingStore size={22} stroke={1.5} />, roles: ['admin'] },
    { name: 'Water Station', path: '/water', icon: <IconDroplet size={22} stroke={1.5} />, roles: ['admin'] },
    { name: 'Customers', path: '/customers', icon: <IconUsers size={22} stroke={1.5} />, roles: ['admin'] },
    { name: 'Reports', path: '/reports', icon: <IconChartBar size={22} stroke={1.5} />, roles: ['admin', 'cashier'] },
  ];

  const navigation = allNavigationItems.filter((item) =>
    item.roles.includes(user?.role || 'cashier')
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex font-sans transition-colors duration-300">

      {/* Sidebar: Added dynamic background logic */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#0a318e] dark:bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-colors duration-300">
        <div className="flex items-center px-6 h-16 border-b border-white/10">
          <motion.img
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.7 }}
            src={LogoImg}
            alt="Logo"
            className="w-10 h-10 object-contain brightness-110 shadow-sm"
          />
          <h1 className="pl-4 text-xl font-bold tracking-tight text-white">EnterpriseSync</h1>
        </div>

        <nav className="mt-6 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;

            // Inventory gets special collapsible treatment
            if (item.path === '/inventory' && item.roles.includes(user?.role || 'cashier')) {
              const inventoryActive = location.pathname === '/inventory' || location.pathname === '/stock-room';
              return (
                <div key="inventory-group">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInventoryOpen(o => !o)}
                    className={`w-full flex items-center px-4 py-3 rounded-md transition-all duration-200 group ${
                      inventoryActive ? 'bg-blue-600/50 dark:bg-blue-600 text-white shadow-md border-l-4 border-yellow-400'
                      : 'text-blue-100 dark:text-slate-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className="mr-3"><IconBox size={22} stroke={1.5} /></span>
                    <span className="font-medium flex-1 text-left">Inventory</span>
                    <motion.span animate={{ rotate: inventoryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <IconChevronDown size={16} />
                    </motion.span>
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {inventoryOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-4 mt-1 space-y-1"
                      >
                        <Link to="/inventory"
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                            location.pathname === '/inventory' ? 'bg-blue-600/40 text-white font-semibold' : 'text-blue-200 dark:text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                          <IconShoppingBag size={18} stroke={1.5} />
                          Selling Inventory
                        </Link>
                        <Link to="/stock-room"
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                            location.pathname === '/stock-room' ? 'bg-blue-600/40 text-white font-semibold' : 'text-blue-200 dark:text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                          <IconBuildingWarehouse size={18} stroke={1.5} />
                          Stock Room
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <motion.div key={item.path} whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 group ${isActive
                    ? 'bg-blue-600/50 dark:bg-blue-600 text-white shadow-md border-l-4 border-yellow-400'
                    : 'text-blue-100 dark:text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span className={`mr-3 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div layoutId="activePill" className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </Link>
              </motion.div>
            );
          })}

          <div className="my-4 border-t border-white/10 mx-6"></div>

          {user?.role === 'admin' && (
            <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/settings"
                className={`flex items-center px-4 py-3 mx-3 rounded-lg transition-all duration-200 group ${location.pathname === '/settings'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-blue-100 dark:text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className={`mr-3 transition-transform duration-200 ${location.pathname !== '/settings' && 'group-hover:rotate-90'}`}>
                  <IconSettings size={22} stroke={1.5} />
                </span>
                <span className="font-medium">Settings</span>
              </Link>
            </motion.div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all font-semibold"
          >
            <IconLogout size={20} stroke={2} />
            <span>Sign out</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 ml-64 flex flex-col">

        {/* Header: Made background and text reactive to theme */}
        <header className="bg-[#0a318e] dark:bg-slate-900 border-b border-white/10 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-bold text-white">
            {location.pathname === '/stock-room' ? 'Stock Room' :
             location.pathname === '/inventory' ? 'Inventory' :
             navigation.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
          </h2>

          <div className="flex items-center space-x-6">
            <ThemeToggle />

            <div className="flex items-center space-x-6 text-white">
              <div className="text-right border-r pr-4 border-white/20">
                {/* Force these to stay light colored */}
                <p className="text-[13px] font-bold uppercase tracking-tight text-white">{user?.name}</p>
                <p className="text-[11px] text-blue-100 dark:text-slate-400">{user?.email}</p>
              </div>
              <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold bg-white text-[#0a318e] shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area: Explicit Light/Dark colors for cards/text inside here will be needed too */}
        <main className="p-8 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-64px)] transition-colors duration-300">
          {/* This div acts as a wrapper to catch any text that doesn't have a color defined */}
          <div className="text-slate-900 dark:text-slate-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};