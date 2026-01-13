import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('hr' | 'boss' | 'manager' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'boss' || user.role === 'manager') {
      return <Navigate to="/boss" replace />;
    } else if (user.role === 'hr') {
      return <Navigate to="/hr" replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

// HOC for HR-only routes (also allows boss/manager for tickets)
export function HRRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Allow boss/manager to access tickets page
  const isTicketsPage = location.pathname.includes('/tickets');
  const allowedRoles = isTicketsPage 
    ? ['hr', 'admin', 'boss', 'manager'] 
    : ['hr', 'admin'];
  
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}

// HOC for Boss-only routes
export function BossRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['boss', 'manager', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}

