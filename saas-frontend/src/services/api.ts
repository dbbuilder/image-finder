import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth'

// API Configuration
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for image processing
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      // Redirect to login page
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface ProductImageRequest {
  productId: string
  productType?: string
  upc?: string
  isbn?: string
  description?: string
  brand?: string
}

export interface ProductImageResponse {
  success: boolean
  imageUrl: string
  fileName: string
}

export interface ImageExistsResponse {
  exists: boolean
  imageUrl?: string
  fileName?: string
}

export interface BatchUploadRequest {
  products: ProductImageRequest[]
}

export interface BatchUploadResponse {
  success: boolean
  results: Array<{
    productId: string
    success: boolean
    imageUrl?: string
    fileName?: string
    error?: string
  }>
}

// Image API endpoints
export const imageApi = {
  // Create single product image
  createImage: (data: ProductImageRequest): Promise<AxiosResponse<ProductImageResponse>> => {
    return apiClient.post('/product-image', data)
  },

  // Check if image exists
  checkImage: (productId: string): Promise<AxiosResponse<ImageExistsResponse>> => {
    return apiClient.get(`/product-image/${productId}`)
  },

  // Delete product image
  deleteImage: (productId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return apiClient.delete(`/product-image/${productId}`)
  },

  // Batch upload (custom endpoint you'd need to add to API)
  batchUpload: (data: BatchUploadRequest): Promise<AxiosResponse<BatchUploadResponse>> => {
    return apiClient.post('/product-image/batch', data)
  },

  // Get image history (custom endpoint)
  getImageHistory: (page = 1, limit = 20): Promise<AxiosResponse<any>> => {
    return apiClient.get('/product-image/history', { params: { page, limit } })
  },

  // Clear cache (admin)
  clearCache: (): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return apiClient.post('/admin/cache/clear')
  },

  // Get cache stats (admin)
  getCacheStats: (): Promise<AxiosResponse<any>> => {
    return apiClient.get('/admin/cache/stats')
  }
}

// Auth API endpoints
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthResponse {
  success: boolean
  user: {
    id: number
    name: string
    email: string
    plan: string
    images_used: number
    images_limit: number
  }
  token: string
}

export const authApi = {
  // User authentication
  login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> => {
    return axios.post(`${API_BASE_URL}/auth/login`, credentials)
  },

  register: (credentials: RegisterCredentials): Promise<AxiosResponse<AuthResponse>> => {
    return axios.post(`${API_BASE_URL}/auth/register`, credentials)
  },

  logout: (): Promise<AxiosResponse<{ message: string }>> => {
    return apiClient.post('/auth/logout')
  },

  getProfile: (): Promise<AxiosResponse<{ user: any }>> => {
    return apiClient.get('/auth/profile')
  },

  updateProfile: (data: any): Promise<AxiosResponse<{ user: any }>> => {
    return apiClient.put('/auth/profile', data)
  },

  // Password reset
  forgotPassword: (email: string): Promise<AxiosResponse<{ message: string }>> => {
    return axios.post(`${API_BASE_URL}/auth/forgot-password`, { email })
  },

  resetPassword: (token: string, password: string): Promise<AxiosResponse<{ message: string }>> => {
    return axios.post(`${API_BASE_URL}/auth/reset-password`, { token, password })
  }
}

// Billing/Subscription API
export const billingApi = {
  // Get subscription info
  getSubscription: (): Promise<AxiosResponse<any>> => {
    return apiClient.get('/billing/subscription')
  },

  // Change plan
  changePlan: (planId: string): Promise<AxiosResponse<any>> => {
    return apiClient.post('/billing/change-plan', { planId })
  },

  // Get invoices
  getInvoices: (): Promise<AxiosResponse<any>> => {
    return apiClient.get('/billing/invoices')
  },

  // Update payment method
  updatePaymentMethod: (paymentMethodId: string): Promise<AxiosResponse<any>> => {
    return apiClient.post('/billing/payment-method', { paymentMethodId })
  },

  // Get usage stats
  getUsageStats: (): Promise<AxiosResponse<any>> => {
    return apiClient.get('/billing/usage')
  },

  // Create Stripe checkout session
  createCheckoutSession: (priceId: string): Promise<AxiosResponse<{ sessionId: string }>> => {
    return apiClient.post('/billing/create-checkout-session', { priceId })
  },

  // Create Stripe portal session
  createPortalSession: (): Promise<AxiosResponse<{ url: string }>> => {
    return apiClient.post('/billing/create-portal-session')
  }
}

// System API
export const systemApi = {
  // Health check
  health: (): Promise<AxiosResponse<{ status: string }>> => {
    return axios.get(`${API_BASE_URL.replace('/api', '')}/health`)
  },

  // Get API documentation
  getDocs: (): Promise<AxiosResponse<any>> => {
    return axios.get(`${API_BASE_URL.replace('/api', '')}/api-docs`)
  }
}

// Utility functions
export const apiUtils = {
  // Handle API errors consistently  
  handleApiError: (error: any) => {
    if (error.response) {
      // Server responded with error status
      return error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
    } else if (error.request) {
      // Request was made but no response received
      return 'Network error: Unable to connect to server'
    } else {
      // Something else happened
      return error.message || 'Unknown error occurred'
    }
  },

  // Format file size
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Generate unique request ID for tracking
  generateRequestId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export default apiClient