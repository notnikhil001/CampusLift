import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiFetch<User>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        connectSocket();
      } else {
        setUser(null);
        disconnectSocket();
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data?.user) {
      if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
      }
      setUser(res.data.user);
      connectSocket();
      return { success: true };
    }

    return {
      success: false,
      error: res.error?.message || 'Login failed',
    };
  };

  const register = async (data: any) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.success) {
      return { success: true, message: res.message };
    }

    return {
      success: false,
      error: res.error?.message || 'Registration failed',
    };
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isVerified: !!user?.isVerified,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
