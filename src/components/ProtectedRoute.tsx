import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return <>{children}</>;
}
