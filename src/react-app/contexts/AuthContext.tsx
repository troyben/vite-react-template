import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/authApi';
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
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  // Save tokens and user to localStorage
  const saveAuth = (user: User, accessToken: string, refreshToken: string) => {
    setUser(user);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = res.data;
      saveAuth(user, accessToken, refreshToken);
      notify.success(`Welcome back, ${user.name}!`);
    } catch (err: any) {
      notify.error(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
        notify.info('Logged out successfully');
      } catch (err) {
        notify.error('Error during logout');
      }
    }
    clearAuth();
  };

  const refresh = async () => {
    if (!refreshToken) throw new Error('No refresh token');
    setLoading(true);
    try {
      const res = await authApi.refresh(refreshToken);
      const { user, accessToken, refreshToken: newRefreshToken } = res.data;
      saveAuth(user, accessToken, newRefreshToken);
    } catch (err: any) {
      notify.error('Session expired. Please login again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth handlers immediately
  const initAuthHandlers = () => {
    authApi.setAuthHandlers({
      getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
      refresh: async () => {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken) throw new Error('No refresh token');
        const res = await authApi.refresh(storedRefreshToken);
        const { user, accessToken, refreshToken: newRefreshToken } = res.data;
        saveAuth(user, accessToken, newRefreshToken);
      },
      logout: async () => {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (storedRefreshToken) {
          try {
            await authApi.logout(storedRefreshToken);
          } catch {}
        }
        clearAuth();
      }
    });
  };

  // Initialize auth handlers on mount
  useEffect(() => {
    initAuthHandlers();
  }, []);

  // Auto-refresh token on mount if refreshToken exists and no accessToken
  useEffect(() => {
    if (!accessToken && refreshToken) {
      refresh().catch(clearAuth);
    }
    // eslint-disable-next-line
  }, []);

  // Re-register handlers when tokens change
  useEffect(() => {
    initAuthHandlers();
  }, [accessToken, refreshToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};