import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Capacitor } from '@capacitor/core';
import { getData, storeData } from '../utils/asyncStorage';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<{ success: boolean }, Error, void>;
};

interface LoginData {
  username: string;
  password: string;
}

// Define a simplified UseMutationResult type just for our needs
interface UseMutationResult<TData, TError, TVariables> {
  mutate: (variables: TVariables) => void;
  isLoading: boolean;
  isError: boolean;
  error: TError | null;
  data?: TData;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Check for an existing user on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        
        // Try to get the user from the server
        if (Capacitor.isNativePlatform()) {
          // On mobile, check for a stored user in preferences
          const storedUser = await getData('offline_user');
          if (storedUser) {
            setUser(storedUser);
          }
        } else {
          // On web, check with the server
          try {
            const userData = await apiRequest('/api/user');
            setUser(userData);
          } catch (error) {
            // Not authenticated or server error
            console.log('Not authenticated or server error:', error);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  // Create a default user for offline mode
  const defaultUser: User = {
    id: 1,
    username: 'admin',
    isAdmin: true
  };
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        setError(null);
        
        if (Capacitor.isNativePlatform()) {
          // In offline mode, just simulate a successful login
          await storeData('offline_user', defaultUser);
          return defaultUser;
        } else {
          // Try to log in with the server
          return await apiRequest('/api/login', 'POST', credentials);
        }
      } catch (error) {
        console.error('Login error:', error);
        throw error instanceof Error ? error : new Error('Login failed');
      }
    },
    onSuccess: (user: User) => {
      setUser(user);
    },
    onError: (error: Error) => {
      setError(error);
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        setError(null);
        
        if (Capacitor.isNativePlatform()) {
          // In offline mode, just remove the stored user
          // Don't actually remove it since we want to stay logged in
          // This is a simplification for this demo
          return { success: true };
        } else {
          // Try to log out with the server
          return await apiRequest('/api/logout', 'POST');
        }
      } catch (error) {
        console.error('Logout error:', error);
        throw error instanceof Error ? error : new Error('Logout failed');
      }
    },
    onSuccess: () => {
      // Only actually log out on web
      if (!Capacitor.isNativePlatform()) {
        setUser(null);
      }
    },
    onError: (error: Error) => {
      setError(error);
    }
  });
  
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    loginMutation,
    logoutMutation
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}