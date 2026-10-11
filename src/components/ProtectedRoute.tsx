import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui';

/** Customers must be logged in (Google) to reach checkout, orders and tracking. */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    const reason = loc.pathname.startsWith('/checkout') ? 'checkout' : 'orders';
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search, reason }} />;
  }
  return <Outlet />;
}
