import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

// User interface representing the authenticated user
interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

// Context type for the auth context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<{ success: boolean }, Error, void>;
};

// Login data interface
interface LoginData {
  username: string;
  password: string;
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Default user for offline mode (in case we can't connect to server)
  const defaultUser: User = {
    id: 1,
    username: 'Rehan',
    isAdmin: true
  };

  // Check if user is logged in on component mount
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const userData = await apiRequest('/api/user');
        setUser(userData);
      } catch (err) {
        // If we can't connect to the API, use default user in offline mode
        console.log('Unable to fetch user, using default offline user');
        setUser(defaultUser);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login mutation
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const user = await apiRequest('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      return user;
    },
    onSuccess: (user: User) => {
      setUser(user);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
      const result = await apiRequest('/api/logout', {
        method: 'POST',
      });
      return result;
    },
    onSuccess: () => {
      setUser(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  // Provide auth context to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}