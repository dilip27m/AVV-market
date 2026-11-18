'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { getAccessToken, setTokens, clearTokens } from '@/lib/auth-tokens';

interface User {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  phone: string;
  meetAddress: string;
  averageRating: number;
  totalRatings: number;
  totalItemsSold: number;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credential: string) => Promise<boolean>;
  logout: () => void;
  /** Re-fetch the current user (e.g. after editing the profile). */
  refreshUser: () => Promise<void>;
  /** Update the cached user locally without a network call. */
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for logged in user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential });
      
      const { user: userData, accessToken, refreshToken } = data.data;
      
      setTokens(accessToken, refreshToken);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, setUser }}>
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
