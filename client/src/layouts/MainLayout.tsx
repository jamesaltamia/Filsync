import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import LogoImg from '../assets/Filamer.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation items with role restrictions
  const allNavigationItems = [
    { name: 'Dashboard', path: '/', icon: '📊', roles: ['admin', 'cashier'] },
    { name: 'Inventory', path: '/inventory', icon: '📦', roles: ['admin'] },
    { name: 'Sales', path: '/sales', icon: '🛒', roles: ['admin', 'cashier'] },
    { name: 'Orders History', path: '/orders', icon: '📋', roles: ['admin', 'cashier'] },
    { name: 'Canteen', path: '/canteen', icon: '🏪', roles: ['admin'] },
    { name: 'Customers', path: '/customers', icon: '👥', roles: ['admin'] },
    { name: 'Reports', path: '/reports', icon: '📈', roles: ['admin', 'cashier'] },
  ];

  // Filter navigation based on user role
  const navigation = allNavigationItems.filter((item) =>
    item.roles.includes(user?.role || 'cashier')
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#0a318e] text-white flex flex-col shadow-2xl z-20">
        <div className="flex items-center px-6 h-16 bg-[#0a318e] space-x-3 border-b border-white/10">
          <motion.img
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.7 }}
            src={LogoImg}
            alt="Logo"
            className="w-10 h-10 object-contain brightness-110 shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight">FilSync <span className="text-blue-300">POS</span></h1>
        </div>

        <nav className="mt-6 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                whileHover={{ x: 5 }} // Moves the item slightly to the right on hover
                whileTap={{ scale: 0.95 }} // Squeezes slightly when clicked
              >
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 group ${isActive
                    ? 'bg-[#1e4eba] text-white shadow-md border-l-4 border-yellow-400'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span className={`mr-3 text-xl transition-transform duration-200 ${!isActive && 'group-hover:scale-120'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}

          <div className="my-4 border-t border-blue-600 mx-6"></div>

          {/* Settings */}
          {user?.role === 'admin' && (
            <motion.div
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/settings"
                className={`flex items-center px-4 py-3 mx-3 rounded-lg transition-all duration-200 group ${location.pathname === '/settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-blue-500 hover:text-white'
                  }`}
              >
                <span className={`mr-3 text-xl transition-transform duration-200 ${location.pathname !== '/settings' && 'group-hover:scale-110'
                  }`}>
                  ⚙️
                </span>
                <span className="font-medium">Settings</span>
                {location.pathname === '/settings' && (
                  <motion.div
                    layoutId="activePill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400"
                  />
                )}
              </Link>
            </motion.div>
          )}
        </nav>

        {/* Logout Button with hover effect */}
        <div className="p-4 border-t border-slate-800">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-grey-800 hover:text-white border border-red-500/20 rounded-xl transition-all font-semibold"
          >
            <span>Sign out</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header - Matching FCU Portal White/Blue contrast */}
        <header className="bg-[#0a318e] border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl font-bold text-white">
              {navigation.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right border-r pr-4 border-gray-100">
              <p className="text-[13px] font-bold text-white uppercase tracking-tight">{user?.name}</p>
              <p className="text-[11px] text-white font-medium">{user?.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shadow-md bg-grey-100 ring-2 ring-blue-50">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-8 verflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
