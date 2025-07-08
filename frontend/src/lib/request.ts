import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { cache, cacheKey } from './cache';
import { getErrorMessage } from './apiUtils';
import { authClient } from './client';

// Configuration
const CONFIG = {
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  RATE_LIMIT_REQUESTS: 50,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

// Rate limiting
interface RateLimit {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimit>();

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(endpoint) || { count: 0, resetTime: now + CONFIG.RATE_LIMIT_WINDOW };

  // Reset counter if window has passed
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + CONFIG.RATE_LIMIT_WINDOW;
  }

  // Check if limit exceeded
  if (limit.count >= CONFIG.RATE_LIMIT_REQUESTS) {
    return false;
  }

  // Increment counter
  limit.count++;
  rateLimits.set(endpoint, limit);
  return true;
}

// Exponential backoff
function getRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
}

// Request configuration
interface RequestConfig extends AxiosRequestConfig {
  retry?: boolean;
  cache?: boolean;
  cacheTTL?: number;
  skipRateLimit?: boolean;
}

// Create axios instance with defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get session token if available
    const session = await authClient.getSession();
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 by redirecting to login
    if (error.response?.status === 401) {
      authClient.clearSession();
      window.location.href = '/auth/signin';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Main request function
export async function request<T>({
  method = 'GET',
  url,
  data,
  params,
  headers,
  retry = true,
  cache: useCache = false,
  cacheTTL = CONFIG.CACHE_TTL,
  skipRateLimit = false,
  ...config
}: RequestConfig): Promise<T> {
  // Generate cache key if caching is enabled
  const cacheKeyString = useCache ? cacheKey('request', method, url, JSON.stringify(params || {})) : null;

  // Check cache
  if (useCache && cacheKeyString) {
    const cached = cache.get<T>(cacheKeyString);
    if (cached) {
      return cached;
    }
  }

  // Check rate limit
  if (!skipRateLimit && !checkRateLimit(url)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Make request with retries
  let lastError: Error | null = null;
  for (let i = 0; i < (retry ? CONFIG.RETRY_COUNT : 1); i++) {
    try {
      const response = await api.request<T>({
        method,
        url,
        data,
        params,
        headers,
        ...config,
      });

      // Cache successful response
      if (useCache && cacheKeyString) {
        cache.set(cacheKeyString, response.data, cacheTTL);
      }

      return response.data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain status codes
      if (error.response?.status && ![408, 429, 500, 502, 503, 504].includes(error.response.status)) {
        throw error;
      }

      // Last retry
      if (i === CONFIG.RETRY_COUNT - 1) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, getRetryDelay(i)));
    }
  }

  throw lastError || new Error('Request failed');
}

// Convenience methods
export const get = <T>(url: string, config?: RequestConfig) => 
  request<T>({ ...config, method: 'GET', url });

export const post = <T>(url: string, data?: any, config?: RequestConfig) => 
  request<T>({ ...config, method: 'POST', url, data });

export const put = <T>(url: string, data?: any, config?: RequestConfig) => 
  request<T>({ ...config, method: 'PUT', url, data });

export const patch = <T>(url: string, data?: any, config?: RequestConfig) => 
  request<T>({ ...config, method: 'PATCH', url, data });

export const del = <T>(url: string, config?: RequestConfig) => 
  request<T>({ ...config, method: 'DELETE', url });

// Upload helper with progress
export const upload = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  return request({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(Math.round(progress));
      }
    },
  });
};

// Download helper
export const download = async (url: string, filename: string) => {
  const response = await request({
    method: 'GET',
    url,
    responseType: 'blob',
  });

  const blob = new Blob([response]);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  try {
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
  } finally {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }
};
