
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  user: {
    role?: string;
  } | null;
  requiredRole?: 'admin' | 'customer';
}

function ProtectedRoute({ user, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();

  // User must be signed in.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Check role when a specific role is required.
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
