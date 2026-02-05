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

    // Check if we have cached user data to avoid blocking UI
    const cachedUser = localStorage.getItem('admin_user');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        // Only allow HR, Boss, Manager, and Admin roles in this portal
        const allowedRoles = ['hr', 'boss', 'manager', 'admin'];
        if (allowedRoles.includes(userData.role)) {
          setUser(userData);
          setToken(storedToken);
          setIsLoading(false);
          // Verify token in background
          verifyTokenInBackground(storedToken);
          return;
        }
      } catch (err) {
        // Invalid cached data, continue to fetch from server
      }
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
      // Update cache
      localStorage.setItem('admin_user', JSON.stringify(userData));
    } catch (error) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify token in background without blocking UI
  const verifyTokenInBackground = async (token: string) => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data.data.user;
      const allowedRoles = ['hr', 'boss', 'manager', 'admin'];
      if (allowedRoles.includes(userData.role)) {
        setUser(userData);
        localStorage.setItem('admin_user', JSON.stringify(userData));
      } else {
        throw new Error('Unauthorized role');
      }
    } catch (error) {
      // Token invalid, clear auth
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    console.log('[AuthContext] Login attempt started', { email, passwordLength: password?.length });
    
    try {
      console.log('[AuthContext] Calling authAPI.login...');
      const response = await authAPI.login(email, password);
      console.log('[AuthContext] Login API response received', { 
        hasData: !!response?.data, 
        hasDataData: !!response?.data?.data,
        success: response?.data?.success 
      });
      
      // Check if response has the expected structure
      if (!response?.data) {
        console.error('[AuthContext] No response.data found');
        return {
          success: false,
          message: 'Invalid response from server - no data'
        };
      }
      
      if (!response.data.success) {
        console.error('[AuthContext] Login unsuccessful in response', response.data);
        return {
          success: false,
          message: response.data.message || 'Login failed'
        };
      }
      
      if (!response.data.data) {
        console.error('[AuthContext] No response.data.data found');
        return {
          success: false,
          message: 'Invalid response from server - missing data'
        };
      }
      
      const { token: newToken, user: userData } = response.data.data;
      console.log('[AuthContext] Extracted token and user', { 
        hasToken: !!newToken, 
        hasUser: !!userData,
        userRole: userData?.role,
        userEmail: userData?.email
      });
      
      // Validate token and user data
      if (!newToken || !userData) {
        console.error('[AuthContext] Missing token or user data', { hasToken: !!newToken, hasUser: !!userData });
        return {
          success: false,
          message: 'Invalid login response - missing token or user data'
        };
      }
      
      // Only allow HR, Boss, Manager, and Admin roles
      const allowedRoles = ['hr', 'boss', 'manager', 'admin'];
      if (!allowedRoles.includes(userData.role)) {
        console.error('[AuthContext] User role not allowed', { role: userData.role, allowedRoles });
        return {
          success: false,
          message: `Access denied. This portal is only for HR, Manager, and Boss roles. Your role: ${userData.role}`
        };
      }
      
      console.log('[AuthContext] Login successful, storing credentials');
      // Store with different key to separate from employee portal
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      console.log('[AuthContext] Login completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Login error caught:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed';
      
      return {
        success: false,
        message: errorMessage
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
