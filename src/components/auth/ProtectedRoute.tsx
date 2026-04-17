import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LogoLoader from '@/components/app/LogoLoader';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LogoLoader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LogoLoader fullScreen />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
