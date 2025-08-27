<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p class="text-gray-600">Welcome back, {{ authStore.user?.name || authStore.user?.email }}</p>
          </div>
          <div class="flex space-x-3">
            <router-link to="/dashboard/single" class="btn-primary">
              <PlusIcon class="w-5 h-5 mr-2" />
              Generate Image
            </router-link>
            <router-link to="/dashboard/batch" class="btn-secondary">
              <QueueListIcon class="w-5 h-5 mr-2" />
              Batch Upload
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Images Generated</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalImages }}</p>
            </div>
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <PhotoIcon class="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">This Month</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.monthlyImages }}</p>
            </div>
            <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CalendarIcon class="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Credits Remaining</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.creditsRemaining }}</p>
            </div>
            <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <StarIcon class="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Success Rate</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.successRate }}%</p>
            </div>
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon class="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Quick Actions -->
        <div class="lg:col-span-1">
          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div class="space-y-3">
              <router-link 
                to="/dashboard/single" 
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <PhotoIcon class="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Generate Single Image</p>
                  <p class="text-sm text-gray-600">Create one image from product details</p>
                </div>
              </router-link>

              <router-link 
                to="/dashboard/batch" 
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mr-3">
                  <QueueListIcon class="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Batch Processing</p>
                  <p class="text-sm text-gray-600">Upload CSV and process multiple products</p>
                </div>
              </router-link>

              <router-link 
                to="/dashboard/history" 
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mr-3">
                  <ClockIcon class="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">View History</p>
                  <p class="text-sm text-gray-600">Browse all your generated images</p>
                </div>
              </router-link>

              <a 
                href="/docs" 
                target="_blank"
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <DocumentTextIcon class="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">API Documentation</p>
                  <p class="text-sm text-gray-600">Learn how to integrate our API</p>
                </div>
              </a>
            </div>
          </div>

          <!-- Usage Chart -->
          <div class="card mt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Monthly Usage</h2>
            <div class="h-48 flex items-end justify-center space-x-2">
              <div 
                v-for="(usage, month) in monthlyUsage" 
                :key="month"
                class="bg-primary-200 hover:bg-primary-300 transition-colors rounded-t flex-1"
                :style="{ height: `${(usage / Math.max(...Object.values(monthlyUsage))) * 180}px` }"
                :title="`${month}: ${usage} images`"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-xs text-gray-600">
              <span v-for="month in Object.keys(monthlyUsage)" :key="month">{{ month.slice(0, 3) }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-2">
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Recent Images</h2>
              <router-link to="/dashboard/history" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </router-link>
            </div>

            <div v-if="loading" class="text-center py-8">
              <div class="loading-spinner mx-auto mb-4"></div>
              <p class="text-gray-600">Loading recent images...</p>
            </div>

            <div v-else-if="recentImages.length === 0" class="text-center py-8">
              <PhotoIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-600 mb-4">No images generated yet</p>
              <router-link to="/dashboard/single" class="btn-primary">
                Generate Your First Image
              </router-link>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="image in recentImages.slice(0, 6)" 
                :key="image.id"
                class="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div class="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <img 
                    v-if="image.imageUrl" 
                    :src="image.imageUrl" 
                    :alt="image.productId"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  >
                  <PhotoIcon v-else class="w-12 h-12 text-gray-300" />
                </div>
                <div class="text-sm">
                  <p class="font-medium text-gray-900 truncate">{{ image.productId }}</p>
                  <p class="text-gray-600 truncate">{{ image.productType || 'Product' }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatDate(image.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { 
  PhotoIcon, 
  PlusIcon, 
  QueueListIcon,
  CalendarIcon,
  StarIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const loading = ref(true)
const recentImages = ref([])

const stats = ref({
  totalImages: 1247,
  monthlyImages: 89,
  creditsRemaining: 1911,
  successRate: 98
})

const monthlyUsage = ref({
  'January': 45,
  'February': 72,
  'March': 89,
  'April': 156,
  'May': 134,
  'June': 89
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    // TODO: Replace with actual API calls
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    recentImages.value = [
      {
        id: '1',
        productId: 'LAP-001',
        productType: 'Laptop',
        imageUrl: 'https://via.placeholder.com/200x200/3b82f6/ffffff?text=Laptop',
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        productId: 'PHONE-002',
        productType: 'Smartphone',
        imageUrl: 'https://via.placeholder.com/200x200/10b981/ffffff?text=Phone',
        createdAt: new Date('2024-01-14')
      },
      {
        id: '3',
        productId: 'BOOK-003',
        productType: 'Book',
        imageUrl: 'https://via.placeholder.com/200x200/f59e0b/ffffff?text=Book',
        createdAt: new Date('2024-01-13')
      }
    ]
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

onMounted(() => {
  loadDashboardData()
})
</script>