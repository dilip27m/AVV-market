'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credential: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for logged in user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
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
      
      Cookies.set('accessToken', accessToken);
      Cookies.set('refreshToken', refreshToken);
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
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
