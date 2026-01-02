import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  department?: {
    _id: string;
    name: string;
  };
  designation?: string;
}

interface User {
  id: string;
  email: string;
  role: 'employee' | 'hr' | 'manager' | 'boss' | 'admin';
  verificationStatus: string;
  employee?: Employee;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isHR: boolean;
  isBoss: boolean;
  isAdmin: boolean;
  canAccessHR: boolean;
  canAccessBoss: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;
  
  // Role checks
  const isHR = user?.role === 'hr';
  const isBoss = user?.role === 'boss';
  const isAdmin = user?.role === 'admin';
  
  // Access checks - who can access what
  const canAccessHR = ['hr', 'admin'].includes(user?.role || '');
  const canAccessBoss = ['boss', 'admin', 'manager'].includes(user?.role || '');

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      const userData = response.data.data.user;
      
      // Only allow HR, Boss, Manager, and Admin roles in this portal
      const allowedRoles = ['hr', 'boss', 'manager', 'admin'];
      if (!allowedRoles.includes(userData.role)) {
        throw new Error('Unauthorized role');
      }
      
      setUser(userData);
      setToken(storedToken);
    } catch (error) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response.data.data;
      
      // Only allow HR, Boss, Manager, and Admin roles
      const allowedRoles = ['hr', 'boss', 'manager', 'admin'];
      if (!allowedRoles.includes(userData.role)) {
        return {
          success: false,
          message: 'Access denied. This portal is only for HR, Manager, and Boss roles.'
        };
      }
      
      // Store with different key to separate from employee portal
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      checkAuth,
      isHR,
      isBoss,
      isAdmin,
      canAccessHR,
      canAccessBoss,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
