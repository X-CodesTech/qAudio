import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useState, useEffect } from 'react';

export type User = {
  id: number;
  username: string;
  role: 'admin' | 'producer' | 'talent';
  displayName: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user
  const {
    data: user,
    error,
    isSuccess,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        // Use fetch directly instead of apiRequest for better error handling
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Unknown login error occurred');
        }
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      // Force refetch to ensure we have the latest user data
      refetch();
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Logout failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
    }
  });

  // Update loading state once we have a response
  useEffect(() => {
    if (isSuccess || isError) {
      setIsLoading(false);
    }
  }, [isSuccess, isError]);

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    isLogoutPending: logoutMutation.isPending,
    refetch,
  };
}