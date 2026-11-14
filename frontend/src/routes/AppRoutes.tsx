
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicLayout from '../layout/PublicLayout';

interface AppRoutesProps {
  user: {
    role?: string;
    full_name?: string;
    email?: string;
  } | null;
  cartCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLogout: () => void;

  home: ReactNode;
  products: ReactNode;
  productDetails: ReactNode;
  login: ReactNode;
  resetPassword: ReactNode;
  cart: ReactNode;
  checkout: ReactNode;
  orderSuccess: ReactNode;
  orders: ReactNode;
  reports: ReactNode;
  profile: ReactNode;
  myReviews: ReactNode;
  adminDashboard: ReactNode;
  adminProducts: ReactNode;
  adminReports: ReactNode;
}

function AppRoutes({
  user,
  cartCount,
  searchQuery,
  onSearchChange,
  onLogout,
  home,
  products,
  productDetails,
  login,
  resetPassword,
  cart,
  checkout,
  orderSuccess,
  orders,
  reports,
  profile,
  myReviews,
  adminDashboard,
  adminProducts,
  adminReports,
}: AppRoutesProps) {
  return (
    <Routes>
      {/* Pages without the store layout */}
      <Route path="/login" element={login} />
      <Route path="/reset-password" element={resetPassword} />
      <Route path="/checkout/success" element={orderSuccess} />

      {/* Store layout */}
      <Route
        element={
          <PublicLayout
            user={user}
            cartCount={cartCount}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onLogout={onLogout}
          />
        }
      >
        <Route index element={home} />
        <Route path="products" element={products} />
        <Route path="products/:id" element={productDetails} />

        {/* Customer pages */}
        <Route element={<ProtectedRoute user={user} requiredRole="customer" />}>
          <Route path="cart" element={cart} />
          <Route path="checkout" element={checkout} />
          <Route path="orders" element={orders} />
          <Route path="my-reviews" element={myReviews} />
          <Route path="reports" element={reports} />
          <Route path="profile" element={profile} />
        </Route>

        {/* Admin pages */}
        <Route element={<ProtectedRoute user={user} requiredRole="admin" />}>
          <Route path="admin" element={adminDashboard} />
          <Route path="admin/products" element={adminProducts} />
          <Route path="admin/reports" element={adminReports} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
