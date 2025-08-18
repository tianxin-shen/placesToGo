const API_BASE_URL = 'http://localhost:3000/api';

// Token management
let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Set access token (called from AuthContext)
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Get current access token
export const getCurrentAccessToken = () => {
  return accessToken;
};

// Common headers for all requests
const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
};

// Common fetch options
export const getFetchOptions = (method: string, body?: any, includeAuth = true) => ({
  method,
  headers: getHeaders(includeAuth),
  credentials: 'include' as const,
  ...(body && { body: JSON.stringify(body) }),
});

// Generic error handler
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic response handler
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || 'An error occurred',
      response.status,
      error
    );
  }
  const data = await response.json();
  console.log('API Response Data:', data);
  
  // For login responses, return the data as-is since it already has the correct structure
  // For other responses, wrap in data property if needed
  if (data.token && data.refreshToken && data.user) {
    // This is a LoginResponse, return as-is
    console.log('Detected LoginResponse, returning as-is');
    return data;
  }
  
  // If the response is already an array or object without a data property,
  // wrap it in an ApiResponse structure
  if (!data.data && (Array.isArray(data) || typeof data === 'object')) {
    return { data };
  }
  
  return data;
};

// Refresh token function (to be set by AuthContext)
let refreshTokenFn: (() => Promise<string | null>) | null = null;

export const setRefreshTokenFunction = (fn: () => Promise<string | null>) => {
  refreshTokenFn = fn;
};

// Handle token refresh with deduplication
const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  if (!refreshTokenFn) {
    throw new Error('Refresh token function not set');
  }

  isRefreshing = true;
  refreshPromise = refreshTokenFn();

  try {
    const newToken = await refreshPromise;
    if (newToken) {
      accessToken = newToken;
    }
    return newToken;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

// Generic API request function with automatic token refresh
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  try {
    console.log('Making API request to:', `${API_BASE_URL}${endpoint}`);
    
    // Add auth header if not already present
    const requestOptions = {
      ...options,
      headers: {
        ...getHeaders(true),
        ...options.headers,
      },
    };

    console.log('Request headers:', requestOptions.headers);
    console.log('Current access token state:', accessToken ? 'exists' : 'null');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryCount === 0) {
      console.log('Token expired, attempting refresh...');
      const newToken = await refreshToken();
      
      if (newToken) {
        // Retry the request with new token
        return apiRequest<T>(endpoint, options, retryCount + 1);
      } else {
        // Refresh failed, throw error
        throw new ApiError('Authentication failed', 401);
      }
    }

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    console.error('API request error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}; 