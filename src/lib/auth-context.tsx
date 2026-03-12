'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface BmrclUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  metroCardNumber: string;
  createdAt: string;
}

interface AuthContextType {
  user: BmrclUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Keys
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const USER_KEY = 'bmrcl_user';
const SESSION_KEY = 'bmrcl_session';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateMetroCardNumber(): string {
  const prefix = 'NM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BmrclUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (session && storedUser) {
        const parsed = JSON.parse(storedUser) as BmrclUser;
        setUser(parsed);
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Check if user exists in localStorage
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as BmrclUser;
        // Simple check — in real app this would verify password hash
        if (parsed.email.toLowerCase() === email.toLowerCase()) {
          setUser(parsed);
          localStorage.setItem(SESSION_KEY, 'active');
          return true;
        }
      }
      
      // For demo: auto-create user if email matches pattern
      // In production, this would fail with "user not found"
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const signup = useCallback(async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const newUser: BmrclUser = {
        id: generateUserId(),
        name,
        email,
        phone,
        metroCardNumber: generateMetroCardNumber(),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(SESSION_KEY, 'active');
      setUser(newUser);
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Hook to check if user is authenticated (for protected routes)
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  return { user, isLoading, isAuthenticated: !!user };
}
