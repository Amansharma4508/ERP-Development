'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'doctor' | 'admin' | 'logistics' | 'wallet_user';
}

type WalletOnboardingStatus = 'pending' | 'in-progress' | 'approved' | 'none';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  walletOnboardingStatus: WalletOnboardingStatus;
  setWalletOnboardingStatus: (status: WalletOnboardingStatus) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getWalletStatusStorageKey = (userId?: string | null) => userId ? `erp_wallet_status_${userId}` : 'erp_wallet_status';

const readWalletOnboardingStatus = (userId?: string | null): WalletOnboardingStatus => {
  if (typeof window === 'undefined') return 'none';
  const stored = window.localStorage.getItem(getWalletStatusStorageKey(userId));
  return (stored as WalletOnboardingStatus) ?? 'none';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletOnboardingStatus, setWalletOnboardingStatusState] = useState<WalletOnboardingStatus>('none');

  useEffect(() => {
    const storedToken = localStorage.getItem('erp_token');
    const storedUser = localStorage.getItem('erp_user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setToken(storedToken);
      setUser(parsedUser);

      const storedStatus = readWalletOnboardingStatus(parsedUser.id);
      if (storedStatus) {
        setWalletOnboardingStatusState(storedStatus);
      } else if (parsedUser.role === 'user') {
        const initialStatus: WalletOnboardingStatus = 'pending';
        setWalletOnboardingStatusState(initialStatus);
        localStorage.setItem(getWalletStatusStorageKey(parsedUser.id), initialStatus);
      } else {
        setWalletOnboardingStatusState('none');
        localStorage.setItem(getWalletStatusStorageKey(parsedUser.id), 'none');
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setWalletOnboardingStatusState('none');
      return;
    }

    const storedStatus = readWalletOnboardingStatus(user.id);
    if (storedStatus) {
      setWalletOnboardingStatusState(storedStatus);
      return;
    }

    if (user.role === 'user') {
      const initialStatus: WalletOnboardingStatus = 'pending';
      setWalletOnboardingStatusState(initialStatus);
      localStorage.setItem(getWalletStatusStorageKey(user.id), initialStatus);
    } else {
      setWalletOnboardingStatusState('none');
      localStorage.setItem(getWalletStatusStorageKey(user.id), 'none');
    }
  }, [user]);

  const setWalletOnboardingStatus = (status: WalletOnboardingStatus) => {
    setWalletOnboardingStatusState(status);
    if (user?.id) {
      localStorage.setItem(getWalletStatusStorageKey(user.id), status);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      if (data.data.user?.role === 'user') {
        const initialStatus: WalletOnboardingStatus = 'pending';
        setWalletOnboardingStatusState(initialStatus);
        localStorage.setItem(getWalletStatusStorageKey(data.data.user.id), initialStatus);
      } else {
        setWalletOnboardingStatusState('none');
        localStorage.setItem(getWalletStatusStorageKey(data.data.user?.id), 'none');
      }
      localStorage.setItem('erp_token', data.data.token);
      localStorage.setItem('erp_user', JSON.stringify(data.data.user));
    } catch (error) {
      console.error('[v0] Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      if (data.data.user?.role === 'user') {
        const initialStatus: WalletOnboardingStatus = 'pending';
        setWalletOnboardingStatusState(initialStatus);
        localStorage.setItem(getWalletStatusStorageKey(data.data.user.id), initialStatus);
      } else {
        setWalletOnboardingStatusState('none');
        localStorage.setItem(getWalletStatusStorageKey(data.data.user?.id), 'none');
      }
      localStorage.setItem('erp_token', data.data.token);
      localStorage.setItem('erp_user', JSON.stringify(data.data.user));
    } catch (error) {
      console.error('[v0] Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWalletOnboardingStatusState('none');
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, walletOnboardingStatus, setWalletOnboardingStatus, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
