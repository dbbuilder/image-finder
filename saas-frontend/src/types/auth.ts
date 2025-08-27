export interface User {
  id: number
  name: string
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  images_used: number
  images_limit: number
  api_key?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

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
  user: User
  token: string
  message?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
}