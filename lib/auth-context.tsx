'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'user' | 'doctor' | 'admin' | 'logistics' | 'wallet_user';
  isApproved: boolean; // false for doctor/logistics until admin approves
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
  // ✅ Updated register signature to accept 'phone'
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletOnboardingStatus, setWalletOnboardingStatusState] = useState<WalletOnboardingStatus>('none');

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
      const parsedUser = JSON.parse(storedUser) as User;
      setToken(storedToken);
      setUser(parsedUser);

      setWalletOnboardingStatusState(readWalletOnboardingStatus(parsedUser.id));

      fetch('/api/wallet-onboarding/status', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            persistWalletOnboardingStatus(parsedUser.id, data.data.status);
          }
        })
        .catch((err) => console.error('Failed to sync wallet status:', err));
    }

    setIsLoading(false);
  }, []);

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

      const loggedInUser: User = {
        ...data.data.user,
        isApproved: data.data.user.isApproved ?? true,
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
      const registeredUser: User = {
        ...responseData.user,
        isApproved: responseData.user?.isApproved ?? (role !== 'doctor' && role !== 'logistics'),
      };
      const status: WalletOnboardingStatus = responseData.walletOnboardingStatus || 'pending';
      const authToken = responseData.token;

      // ✅ FIX: Save token, user and update context state immediately upon registration
      if (authToken) {
        setToken(authToken);
        localStorage.setItem('erp_token', authToken);
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