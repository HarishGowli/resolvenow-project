import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return <>{children}</>;
}
