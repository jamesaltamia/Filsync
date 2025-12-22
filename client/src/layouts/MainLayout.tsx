import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-blue-800 text-white flex flex-col">
        <div className="flex items-center justify-center h-16 bg-blue-900 space-x-2">
          <img
            src={LogoImg} // Replace with your actual path, e.g., src={logoImg}
            alt="Logo"
            className="w-10 h-10 object-contain " // Adjust size as needed
          />
          <h1 className="text-xl font-bold">FilSync POS</h1>
        </div>

        <nav className="mt-4 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-300 hover:bg-blue-700 transition-colors ${isActive ? 'bg-blue-700 border-r-4 border-green-500' : ''
                  }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-blue-600 mx-6"></div>

          {/* Settings */}
          {user?.role === 'admin' && (
            <Link
              to="/settings"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-blue-700 transition-colors ${location.pathname === '/settings'
                ? 'bg-blue-700 border-r-4 border-green-500'
                : ''
                }`}
            >
              <span className="mr-3">⚙️</span>
              <span>Settings</span>
            </Link>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded transition-colors"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold">
            {navigation.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded ${user?.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                }`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <span className="text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
