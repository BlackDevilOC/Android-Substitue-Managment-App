import { QueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

/**
 * Get the appropriate API URL based on the environment
 * - In native platforms, use the local server URL
 * - In web, use relative URLs that connect to the backend
 */
function getApiUrl(url: string): string {
  if (Capacitor.isNativePlatform()) {
    // On mobile devices, use the local server running on localhost
    const localServerPort = 5000;
    const baseUrl = `http://localhost:${localServerPort}`;
    
    // If the URL already includes the protocol, return it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Otherwise, prepend the local server URL
    return `${baseUrl}${url}`;
  }
  
  // On web, use relative URLs
  return url;
}

/**
 * Throws an error if the response is not OK
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // If we can't parse the error response as JSON, just use the status message
      console.error('Error parsing error response', e);
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Handles API requests with proper error handling
 */
export async function apiRequest(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  options: RequestInit = {}
) {
  try {
    const apiUrl = getApiUrl(url);
    
    const defaultOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };
    
    if (data) {
      defaultOptions.body = JSON.stringify(data);
    }
    
    console.log(`[API] ${method} request to ${apiUrl}`);
    
    const res = await fetch(apiUrl, defaultOptions);
    await throwIfResNotOk(res);
    
    // For DELETE requests or empty responses, return { success: true }
    if (method === 'DELETE' || res.headers.get('content-length') === '0') {
      return { success: true };
    }
    
    return await res.json();
  } catch (error) {
    console.error(`[API] Error in ${method} request to ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Creates a query function for TanStack Query
 */
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => async ({ queryKey }: { queryKey: string[] }): Promise<T | null> => {
  const url = queryKey[0];
  
  try {
    const data = await apiRequest(url);
    return data as T;
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      if (options.on401 === "returnNull") {
        return null;
      }
    }
    
    throw error;
  }
};

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      queryFn: getQueryFn({ on401: "throw" }),
    },
  },
});