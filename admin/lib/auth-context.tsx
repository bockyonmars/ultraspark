'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { clearTokenCookie, getTokenFromCookie, setTokenCookie } from './session';
import type { AdminUser } from '@/types/api';

type AuthContextValue = {
  admin: AdminUser | null;
  token: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokenCookie();
    setToken('');
    setAdmin(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    const currentToken = getTokenFromCookie();
    if (!currentToken) {
      setToken('');
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(currentToken);
      const currentAdmin = await api.get<AdminUser>('/auth/me', currentToken);
      setAdmin(currentAdmin);
    } catch {
      clearTokenCookie();
      setToken('');
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAdmin();
  }, [refreshAdmin]);

  const login = useCallback((nextToken: string, nextAdmin: AdminUser) => {
    setTokenCookie(nextToken);
    setToken(nextToken);
    setAdmin(nextAdmin);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      isLoading,
      isAuthenticated: Boolean(token && admin),
      login,
      logout,
      refreshAdmin,
    }),
    [admin, token, isLoading, login, logout, refreshAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
