import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { InventoryPage } from './pages/Inventory/InventoryPage';
import { SalesPage } from './pages/Sales/SalesPage';
import { OrdersHistoryPage } from './pages/OrdersHistory/OrdersHistoryPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { CanteenPage } from './pages/Canteen/CanteenPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected routes wrapped in MainLayout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />

                      {/* Admin only routes */}
                      <Route
                        path="/inventory"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <InventoryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/canteen"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <CanteenPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customers"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <CustomersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin and Cashier routes */}
                      <Route path="/sales" element={<SalesPage />} />
                      <Route path="/orders" element={<OrdersHistoryPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
