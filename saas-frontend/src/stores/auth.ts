import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth'
import { authApi } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  const login = async (credentials: LoginCredentials): Promise<void> => {
    loading.value = true
    try {
      const response = await authApi.login(credentials)
      setAuth(response.data)
    } finally {
      loading.value = false
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    loading.value = true
    try {
      const response = await authApi.register(credentials)
      setAuth(response.data)
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  const setAuth = (authData: AuthResponse) => {
    user.value = authData.user
    token.value = authData.token
    localStorage.setItem('auth_token', authData.token)
    localStorage.setItem('user_data', JSON.stringify(authData.user))
  }

  const loadStoredAuth = () => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_data')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Error parsing stored user data:', e)
        logout()
      }
    }
  }

  const refreshUser = async (): Promise<void> => {
    if (!token.value) return
    
    try {
      const response = await authApi.getProfile()
      user.value = response.data.user
      localStorage.setItem('user_data', JSON.stringify(response.data.user))
    } catch (error) {
      console.error('Error refreshing user:', error)
      logout()
    }
  }

  // Initialize auth state from localStorage
  loadStoredAuth()

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    setAuth,
    loadStoredAuth,
    refreshUser
  }
})