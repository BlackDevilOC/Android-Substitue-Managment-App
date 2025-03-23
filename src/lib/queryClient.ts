import { Capacitor } from '@capacitor/core';
import { QueryClient } from '@tanstack/react-query';

/**
 * Get the appropriate API URL based on the environment
 * - In native platforms, use the local server URL
 * - In web, use relative URLs that connect to the backend
 */
function getApiUrl(url: string): string {
  if (Capacitor.isNativePlatform()) {
    // On mobile, redirect to local server
    const localServerUrl = 'http://localhost:5000';
    
    // If URL already starts with http, don't modify it (likely an external API)
    if (url.startsWith('http')) {
      return url;
    }
    
    // Add local server URL as prefix
    return `${localServerUrl}${url}`;
  }
  
  // In web, use relative URLs
  return url;
}

/**
 * Throws an error if the response is not OK
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `API Error: ${res.status} ${res.statusText}`;
    
    try {
      const data = await res.json();
      if (data.error) {
        errorMessage = data.error;
      }
    } catch (e) {
      // Unable to parse JSON error message, use default
    }
    
    const error = new Error(errorMessage);
    throw error;
  }
}

/**
 * Handles API requests with proper error handling
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const apiUrl = getApiUrl(url);
    
    // Set default headers if not provided
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    console.log(`[API] ${mergedOptions.method || 'GET'} ${apiUrl}`);
    
    const res = await fetch(apiUrl, mergedOptions);
    
    await throwIfResNotOk(res);
    
    // For 204 No Content, return empty object
    if (res.status === 204) {
      return {};
    }
    
    return await res.json();
  } catch (error) {
    console.error(`[API] Request failed for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Creates a query function for TanStack Query
 */
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: string[] }): Promise<T | null> => {
    try {
      const [url, ...params] = queryKey;
      
      // Handle query params if provided
      let finalUrl = url;
      if (params.length > 0 && typeof params[0] === 'object') {
        const queryParams = new URLSearchParams(params[0] as Record<string, string>).toString();
        finalUrl = `${url}?${queryParams}`;
      }
      
      return await apiRequest(finalUrl);
    } catch (error) {
      // Handle 401 Unauthorized based on options
      if (error instanceof Response && error.status === 401) {
        if (options.on401 === "returnNull") {
          return null;
        }
      }
      
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      queryFn: getQueryFn<unknown>({ on401: "returnNull" }),
    },
  },
});