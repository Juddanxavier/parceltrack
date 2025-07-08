import { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

/**
 * Extract error message from API response
 */
const ERROR_MESSAGES = {
  // Auth errors
  'UNAUTHORIZED': 'Please log in to continue',
  'FORBIDDEN': 'You do not have permission to perform this action',
  'INVALID_CREDENTIALS': 'Invalid email or password',
  'ACCOUNT_LOCKED': 'Account temporarily locked. Please try again later',
  'SESSION_EXPIRED': 'Your session has expired. Please log in again',
  
  // Resource errors
  'NOT_FOUND': 'The requested resource was not found',
  'ALREADY_EXISTS': 'This resource already exists',
  'VALIDATION_ERROR': 'Please check your input and try again',
  
  // Rate limiting
  'RATE_LIMIT': 'Too many requests. Please wait a moment',
  
  // Server errors
  'SERVER_ERROR': 'An unexpected error occurred. Please try again later',
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable',
  'DATABASE_ERROR': 'Database operation failed',
  
  // File errors
  'FILE_TOO_LARGE': 'File size exceeds the maximum limit',
  'INVALID_FILE_TYPE': 'File type not supported',
  'UPLOAD_FAILED': 'Failed to upload file',
  
  // Default
  'DEFAULT': 'An unexpected error occurred'
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

export function getErrorMessage(error: any): string {
  // Get error code from response
  const errorCode = error.response?.data?.code as ErrorCode;
  
  // If we have a mapped message for this code, use it
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  
  // For validation errors, try to get specific field errors
  if (error.response?.data?.errors) {
    const fieldErrors = error.response.data.errors;
    return Object.entries(fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
  }
  
  // Fallback to default message
  return ERROR_MESSAGES.DEFAULT
}

/**
 * Extract full error details from API response
 */
export function getApiError(error: any): ApiError {
  const apiError: ApiError = {
    message: getErrorMessage(error)
  }
  
  if (error.response) {
    apiError.status = error.response.status
    apiError.details = error.response.data
  }
  
  if (error.code) {
    apiError.code = error.code
  }
  
  return apiError
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK'
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: any): boolean {
  return error.response?.status === 403
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: any): boolean {
  return error.response?.status === 404
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error.response?.status === 422 || error.response?.status === 400
}

/**
 * Check if error is a server error
 */
export function isServerError(error: any): boolean {
  return error.response?.status >= 500
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error.response?.status === 429
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }
  
  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.'
  }
  
  if (isRateLimitError(error)) {
    return 'Too many requests. Please wait a moment before trying again.'
  }
  
  if (isPermissionError(error)) {
    return 'You do not have permission to perform this action.'
  }
  
  if (isNotFoundError(error)) {
    return 'The requested resource was not found.'
  }
  
  if (isValidationError(error)) {
    return getErrorMessage(error) || 'Please check your input and try again.'
  }
  
  if (isServerError(error)) {
    return 'A server error occurred. Please try again later.'
  }
  
  return getErrorMessage(error)
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string, allowedTypes: string[] = ['application/pdf', 'image/jpeg']): void {
  if (!allowedTypes.includes(blob.type)) {
    throw new Error('Invalid file type');
  }
  
  if (blob.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File too large');
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[^\w\s.-]/gi, ''); // Sanitize filename
  
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Format user name for display
 */
export function formatUserName(name: string): string {
  if (!name) return ''
  return name.split(' ').map(part => 
    part && part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''
  ).join(' ')
}

/**
 * Get user initials
 */
export function getUserInitials(name: string): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map(part => part && part.length > 0 ? part.charAt(0).toUpperCase() : '')
    .filter(initial => initial)
    .slice(0, 2)
    .join('')
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate a random password
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * Request throttling utility to prevent rate limiting
 */
const requestQueue = new Map<string, number>()
const requestCache = new Map<string, { data: any, timestamp: number }>()
const RATE_LIMIT_DELAY = 2000 // 2 seconds between requests to same endpoint
const CACHE_DURATION = 30000 // 30 seconds cache

export const throttleRequest = async (endpoint: string): Promise<void> => {
  const now = Date.now()
  const lastRequest = requestQueue.get(endpoint) || 0
  const timeSinceLastRequest = now - lastRequest
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest
    console.log(`⏱️ Throttling request to ${endpoint}, waiting ${waitTime}ms`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  requestQueue.set(endpoint, Date.now())
}

/**
 * Cache GET requests to prevent duplicate calls
 */
export const getCachedRequest = <T>(endpoint: string): T | null => {
  const cached = requestCache.get(endpoint)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Using cached data for ${endpoint}`)
    return cached.data as T
  }
  return null
}

export const setCachedRequest = <T>(endpoint: string, data: T): void => {
  requestCache.set(endpoint, { data, timestamp: Date.now() })
}

/**
 * Retry request with exponential backoff on rate limit errors
 */
export const retryWithBackoff = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error: any) {
      lastError = error
      
      if (isRateLimitError(error) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
        console.warn(`Rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}
