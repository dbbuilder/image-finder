<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <PhotoIcon class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-gray-900">ImageAPI</span>
          </router-link>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <router-link 
              to="/" 
              class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.name === 'Home' }"
            >
              Home
            </router-link>
            <router-link 
              to="/pricing" 
              class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.name === 'Pricing' }"
            >
              Pricing
            </router-link>
            <router-link 
              to="/docs" 
              class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.name === 'Documentation' }"
            >
              Docs
            </router-link>
            <router-link 
              to="/dashboard" 
              class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              :class="{ 'text-primary-600': $route.name === 'Dashboard' }"
            >
              Dashboard
            </router-link>
          </div>

          <!-- Auth Buttons -->
          <div class="flex items-center space-x-4">
            <template v-if="!authStore.isAuthenticated">
              <router-link to="/login" class="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </router-link>
              <router-link to="/register" class="btn-primary">
                Get Started
              </router-link>
            </template>
            <template v-else>
              <div class="relative">
                <button 
                  @click="showUserMenu = !showUserMenu"
                  class="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <UserIcon class="w-5 h-5" />
                  <span class="font-medium">{{ authStore.user?.email }}</span>
                </button>
                
                <!-- User Dropdown Menu -->
                <div 
                  v-if="showUserMenu" 
                  @click.away="showUserMenu = false"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                >
                  <router-link 
                    to="/dashboard" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </router-link>
                  <router-link 
                    to="/settings" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </router-link>
                  <hr class="my-1">
                  <button 
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </template>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button 
              @click="showMobileMenu = !showMobileMenu"
              class="text-gray-600 hover:text-gray-900"
            >
              <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6" />
              <XMarkIcon v-else class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200 pt-4 pb-4">
          <div class="flex flex-col space-y-3">
            <router-link to="/" class="text-gray-600 hover:text-gray-900 font-medium">Home</router-link>
            <router-link to="/pricing" class="text-gray-600 hover:text-gray-900 font-medium">Pricing</router-link>
            <router-link to="/docs" class="text-gray-600 hover:text-gray-900 font-medium">Docs</router-link>
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900 font-medium">Dashboard</router-link>
            <hr>
            <template v-if="!authStore.isAuthenticated">
              <router-link to="/login" class="text-gray-600 hover:text-gray-900 font-medium">Sign In</router-link>
              <router-link to="/register" class="btn-primary inline-block text-center">Get Started</router-link>
            </template>
            <template v-else>
              <button @click="handleLogout" class="text-left text-gray-600 hover:text-gray-900 font-medium">
                Sign Out
              </button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <PhotoIcon class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold text-gray-900">ImageAPI</span>
            </div>
            <p class="text-gray-600 text-sm">
              Professional product image generation API for e-commerce and applications.
            </p>
          </div>

          <!-- Product -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">Product</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><router-link to="/features" class="hover:text-gray-900">Features</router-link></li>
              <li><router-link to="/pricing" class="hover:text-gray-900">Pricing</router-link></li>
              <li><router-link to="/docs" class="hover:text-gray-900">API Documentation</router-link></li>
              <li><a href="/api-docs" class="hover:text-gray-900">OpenAPI Spec</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">Support</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="#" class="hover:text-gray-900">Help Center</a></li>
              <li><a href="#" class="hover:text-gray-900">Contact Us</a></li>
              <li><a href="#" class="hover:text-gray-900">Status Page</a></li>
              <li><a href="#" class="hover:text-gray-900">Community</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="#" class="hover:text-gray-900">Privacy Policy</a></li>
              <li><a href="#" class="hover:text-gray-900">Terms of Service</a></li>
              <li><a href="#" class="hover:text-gray-900">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <hr class="my-8 border-gray-200">
        
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm text-gray-500">
            © {{ new Date().getFullYear() }} ImageAPI. All rights reserved.
          </p>
          <div class="flex space-x-4 mt-4 md:mt-0">
            <!-- Social links would go here -->
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { PhotoIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

const handleLogout = () => {
  authStore.logout()
  showUserMenu.value = false
  toast.success('Signed out successfully')
}
</script>