import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setAuthHandlers } from '../services/authService';
import * as authApi from '../services/authService';
import { notify } from '../utils/notifications';

interface User {
  id: number;
  
  name: string;
  email: string;
  mobile: string;
  role: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onSessionExpired?: () => void;
}

export const AuthProvider = ({ children, onSessionExpired }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Simplified auth state management
  const saveAuth = (userData: any) => {
    const { user, accessToken, refreshToken } = userData;
    const authData = {
      ...user,
      accessToken,
      refreshToken
    };
    localStorage.setItem('user', JSON.stringify(authData));
    setUser(authData);
  };

  const clearAuth = async (): Promise<void> => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setAuthHandlers({
            getAccessToken: () => userData.accessToken,
            refresh: async () => {
              try {
                const response = await authApi.refresh(userData.refreshToken);
                if (response.data.success) {
                  saveAuth(response.data.data);
                  return response.data.data.accessToken;
                } else {
                  throw new Error(response.data.message || 'Refresh failed');
                }
              } catch (refreshError: any) {
                console.error('Refresh error:', refreshError);
                notify.error('Session expired. Please login again.');
                await clearAuth();
                onSessionExpired?.();
                throw refreshError;
              }
            },
            logout: clearAuth
          });
        } catch (error) {
          clearAuth();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [onSessionExpired]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login(email, password);
      if (response.data.success) {
        saveAuth(response.data.data);
        notify.success(`Welcome back, ${response.data.data.user.name}!`);
      }
    } catch (error: any) {
      notify.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.refreshToken) {
        await authApi.logout(userData.refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      notify.info('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};