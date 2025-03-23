import { QueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

// Local server address when running on mobile device
const LOCAL_SERVER_URL = 'http://localhost:5000';

/**
 * Get the appropriate API URL based on the environment
 * - In native platforms, use the local server URL
 * - In web, use relative URLs that connect to the backend
 */
function getApiUrl(url: string): string {
  if (Capacitor.isNativePlatform()) {
    // Running on device, use local server
    if (url.startsWith('/')) {
      return `${LOCAL_SERVER_URL}${url}`;
    } else {
      return `${LOCAL_SERVER_URL}/${url}`;
    }
  } else {
    // Running in browser, use relative URLs
    return url;
  }
}

/**
 * Throws an error if the response is not OK
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `API error: ${res.status} ${res.statusText}`
    );
    throw Object.assign(error, {
      status: res.status,
      statusText: res.statusText,
      data: errorData,
    });
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
    // Transform the URL to point to the local server when on device
    const apiUrl = getApiUrl(url);
    
    // Default options for fetch
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };
    
    // Merge the default options with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };
    
    // Make the request
    const res = await fetch(apiUrl, mergedOptions);
    
    // Throw for non-200 responses
    await throwIfResNotOk(res);
    
    // Parse the response as JSON
    return res.json();
  } catch (error) {
    console.error(`[API] Request failed: ${url}`, error);
    throw error;
  }
}

// Custom queryFn for handling 401 responses
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async (context: { queryKey: (string | undefined)[] }): Promise<T | null> => {
    try {
      const [url] = context.queryKey;
      
      if (!url) {
        throw new Error("URL is required in queryKey[0]");
      }
      
      return await apiRequest(url);
    } catch (error: any) {
      if (error.status === 401 && options.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
};

// Create the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      queryFn: getQueryFn({ on401: "returnNull" }),
    },
  },
});

export default queryClient;