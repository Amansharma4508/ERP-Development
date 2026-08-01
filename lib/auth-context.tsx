'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'user' | 'doctor' | 'admin' | 'logistics' | 'wallet_user';
  isApproved: boolean;
}

type WalletOnboardingStatus = 'pending' | 'in-progress' | 'approved' | 'none';

interface AuthResult {
  user: User;
  walletOnboardingStatus: WalletOnboardingStatus;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  walletOnboardingStatus: WalletOnboardingStatus;
  setWalletOnboardingStatus: (status: WalletOnboardingStatus) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, fullName: string, role: string, phone: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getWalletStatusStorageKey = (userId?: string | null) => userId ? `erp_wallet_status_${userId}` : 'erp_wallet_status';

const readWalletOnboardingStatus = (userId?: string | null): WalletOnboardingStatus => {
  if (typeof window === 'undefined') return 'none';
  const stored = window.localStorage.getItem(getWalletStatusStorageKey(userId));
  return (stored as WalletOnboardingStatus) || 'none';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem('erp_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('erp_token');
  });

  const [isLoading, setIsLoading] = useState(true);
  const [walletOnboardingStatus, setWalletOnboardingStatusState] = useState<WalletOnboardingStatus>(() => {
    if (typeof window === 'undefined') return 'none';
    try {
      const storedUser = localStorage.getItem('erp_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return readWalletOnboardingStatus(parsed.id);
      }
    } catch {
      // ignore
    }
    return 'none';
  });

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setWalletOnboardingStatusState('none');
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    router.push('/login');
  }, [router]);

  const persistWalletOnboardingStatus = (userId: string, status: WalletOnboardingStatus) => {
    setWalletOnboardingStatusState(status);
    localStorage.setItem(getWalletStatusStorageKey(userId), status);
  };

  const setWalletOnboardingStatus = (status: WalletOnboardingStatus) => {
    setWalletOnboardingStatusState(status);
    if (user?.id) {
      localStorage.setItem(getWalletStatusStorageKey(user.id), status);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('erp_token');
    const storedUser = localStorage.getItem('erp_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setWalletOnboardingStatusState(readWalletOnboardingStatus(parsedUser.id));

        fetch('/api/wallet-onboarding/status', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => {
            if (res.status === 401) {
              logout();
              throw new Error('Unauthorized / Token expired');
            }
            return res.json();
          })
          .then((data) => {
            if (data.success && data.data?.status) {
              persistWalletOnboardingStatus(parsedUser.id, data.data.status);
            }
          })
          .catch((err) => console.error('Failed to sync wallet status:', err));
      } catch (e) {
        console.error('Failed to parse stored user or session error:', e);
        logout();
      }
    }

    setIsLoading(false);
  }, [logout]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
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

      const apiUser = data.data.user;
      const loggedInUser: User = {
        ...apiUser,
        role: (apiUser.role || apiUser.account_type || 'user').toLowerCase() as User['role'],
        isApproved: apiUser.isApproved ?? apiUser.is_approved ?? true,
      };

      const status: WalletOnboardingStatus = data.data.walletOnboardingStatus || 'none';

      setToken(data.data.token);
      setUser(loggedInUser);
      persistWalletOnboardingStatus(loggedInUser.id, status);

      localStorage.setItem('erp_token', data.data.token);
      localStorage.setItem('erp_user', JSON.stringify(loggedInUser));

      return { user: loggedInUser, walletOnboardingStatus: status };
    } catch (error) {
      console.error('[v0] Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: string, phone: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role, phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      const responseData = result.data || result;
      const apiRegUser = responseData.user || {};
      
      const registeredUser: User = {
        ...apiRegUser,
        role: (apiRegUser.role || apiRegUser.account_type || role || 'user').toLowerCase() as User['role'],
        isApproved: apiRegUser?.isApproved ?? apiRegUser?.is_approved ?? (role !== 'doctor' && role !== 'logistics'),
      };

      const status: WalletOnboardingStatus = responseData.walletOnboardingStatus || 'pending';
      const authToken = responseData.token;

      if (authToken) {
        setToken(authToken);
        localStorage.setItem('erp_token', authToken);
      } else {
        localStorage.removeItem('erp_token');
      }
      
      if (registeredUser) {
        setUser(registeredUser);
        localStorage.setItem('erp_user', JSON.stringify(registeredUser));
        persistWalletOnboardingStatus(registeredUser.id, status);
      }

      return {
        user: registeredUser,
        walletOnboardingStatus: status,
      };

    } catch (error) {
      console.error('[v0] Register error:', error);
      throw error;
    }
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