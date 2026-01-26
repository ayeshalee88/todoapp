import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../lib/api';

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}
// Add these interfaces for API responses
interface LoginResponse {
  access_token: string;
  user_id?: string;
  token_type?: string;
}

interface SignupResponse {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, we would verify the token and get user info
      // For now, we'll just set a dummy user
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
   
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiClient.login(email, password);

    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data && (result.data as any).access_token) {
      // Store token in localStorage
      localStorage.setItem('token', (result.data as any).access_token);

      // Create user object based on the login response
      const userData: User = {
        id: (result.data as any).user_id || 'unknown', // Adjust based on actual API response
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const signup = async (email: string, password: string) => {
    const result = await apiClient.signup(email, password);

    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data) {
      // Store user data
      const userData: User = {
        id: (result.data as any).id || 'unknown',
        email: (result.data as any).email,
        created_at: (result.data as any).created_at,
        updated_at: (result.data as any ).updated_at,
      };

      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};