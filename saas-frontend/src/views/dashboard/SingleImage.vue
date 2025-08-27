<template>
  <div class="single-image-generator">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center">
          <router-link 
            to="/dashboard" 
            class="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeftIcon class="w-5 h-5" />
          </router-link>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Generate Single Image</h1>
            <p class="text-gray-600">Create a product image from description and details</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Form -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
          
          <form @submit.prevent="generateImage" class="space-y-4">
            <!-- Product ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Product ID <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="form.productId"
                type="text" 
                required
                class="input-field"
                placeholder="e.g., LAP-001, PHONE-123"
              >
              <p class="text-xs text-gray-500 mt-1">Unique identifier for your product</p>
            </div>

            <!-- Product Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <select v-model="form.productType" class="input-field">
                <option value="">Select a category</option>
                <option value="Laptop">Laptop</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Tablet">Tablet</option>
                <option value="Headphones">Headphones</option>
                <option value="Book">Book</option>
                <option value="Clothing">Clothing</option>
                <option value="Shoes">Shoes</option>
                <option value="Furniture">Furniture</option>
                <option value="Kitchen">Kitchen Appliance</option>
                <option value="Electronics">Electronics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Brand -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input 
                v-model="form.brand"
                type="text" 
                class="input-field"
                placeholder="e.g., Apple, Samsung, Nike"
              >
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea 
                v-model="form.description"
                rows="3"
                class="input-field"
                placeholder="Detailed product description..."
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Be specific for better image quality</p>
            </div>

            <!-- UPC/ISBN -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  UPC Code
                </label>
                <input 
                  v-model="form.upc"
                  type="text" 
                  class="input-field"
                  placeholder="123456789012"
                  maxlength="12"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  ISBN
                </label>
                <input 
                  v-model="form.isbn"
                  type="text" 
                  class="input-field"
                  placeholder="9781234567890"
                  maxlength="13"
                >
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4">
              <button 
                type="submit" 
                :disabled="loading || !isFormValid"
                class="btn-primary w-full flex items-center justify-center"
                :class="{ 'opacity-50 cursor-not-allowed': loading || !isFormValid }"
              >
                <div v-if="loading" class="loading-spinner mr-2"></div>
                <SparklesIcon v-else class="w-5 h-5 mr-2" />
                {{ loading ? 'Generating...' : 'Generate Image' }}
              </button>
            </div>

            <!-- Requirements -->
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
              <ul class="text-xs text-gray-600 space-y-1">
                <li class="flex items-start">
                  <CheckIcon class="w-3 h-3 text-green-500 mt-0.5 mr-1 flex-shrink-0" />
                  Product ID is required
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-3 h-3 text-green-500 mt-0.5 mr-1 flex-shrink-0" />
                  At least one additional field (type, brand, description, UPC, or ISBN)
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-3 h-3 text-green-500 mt-0.5 mr-1 flex-shrink-0" />
                  More details = better image quality
                </li>
              </ul>
            </div>
          </form>
        </div>

        <!-- Preview/Result -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Generated Image</h2>
          
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <div class="loading-spinner mx-auto mb-4" style="width: 40px; height: 40px; border-width: 4px;"></div>
            <p class="text-gray-600 mb-2">Generating your image...</p>
            <p class="text-sm text-gray-500">This may take 10-30 seconds</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <ExclamationTriangleIcon class="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p class="text-red-600 font-medium mb-2">Generation Failed</p>
            <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
            <button @click="clearError" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Try Again
            </button>
          </div>

          <!-- Success State -->
          <div v-else-if="result" class="space-y-4">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                :src="result.imageUrl" 
                :alt="form.productId"
                class="w-full h-full object-cover"
                @load="imageLoaded = true"
                @error="handleImageError"
              >
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-start">
                <CheckCircleIcon class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-green-800 mb-1">Image Generated Successfully!</p>
                  <p class="text-xs text-green-700 mb-2">
                    Product ID: {{ form.productId }} • File: {{ result.fileName }}
                  </p>
                  
                  <!-- Action Buttons -->
                  <div class="flex flex-wrap gap-2 mt-3">
                    <button 
                      @click="copyImageUrl"
                      class="text-xs bg-white border border-green-300 text-green-700 px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
                    >
                      {{ copied ? 'Copied!' : 'Copy URL' }}
                    </button>
                    <a 
                      :href="result.imageUrl" 
                      target="_blank"
                      class="text-xs bg-white border border-green-300 text-green-700 px-3 py-1 rounded-md hover:bg-green-50 transition-colors inline-block"
                    >
                      View Full Size
                    </a>
                    <button 
                      @click="downloadImage"
                      class="text-xs bg-white border border-green-300 text-green-700 px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Default State -->
          <div v-else class="text-center py-12">
            <PhotoIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-600">Your generated image will appear here</p>
          </div>
        </div>
      </div>

      <!-- Recent Generations -->
      <div v-if="recentGenerations.length > 0" class="mt-12">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Generations</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              v-for="item in recentGenerations.slice(0, 8)" 
              :key="item.id"
              class="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              @click="loadGeneration(item)"
            >
              <div class="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <img 
                  :src="item.imageUrl" 
                  :alt="item.productId"
                  class="w-full h-full object-cover"
                >
              </div>
              <p class="text-sm font-medium text-gray-900 truncate">{{ item.productId }}</p>
              <p class="text-xs text-gray-600 truncate">{{ item.productType || 'Product' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { 
  ArrowLeftIcon,
  SparklesIcon,
  PhotoIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { imageApi } from '@/services/api'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const result = ref(null)
const copied = ref(false)
const imageLoaded = ref(false)
const recentGenerations = ref([])

const form = ref({
  productId: '',
  productType: '',
  brand: '',
  description: '',
  upc: '',
  isbn: ''
})

const isFormValid = computed(() => {
  const hasProductId = form.value.productId.trim().length > 0
  const hasSearchParam = form.value.productType || 
                        form.value.brand || 
                        form.value.description || 
                        form.value.upc || 
                        form.value.isbn
  return hasProductId && hasSearchParam
})

const generateImage = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await imageApi.createImage({
      productId: form.value.productId.trim(),
      productType: form.value.productType || undefined,
      brand: form.value.brand || undefined,
      description: form.value.description || undefined,
      upc: form.value.upc || undefined,
      isbn: form.value.isbn || undefined
    })
    
    result.value = response.data
    
    // Add to recent generations
    recentGenerations.value.unshift({
      id: Date.now().toString(),
      ...form.value,
      imageUrl: response.data.imageUrl,
      createdAt: new Date()
    })
    
    // Limit recent generations
    if (recentGenerations.value.length > 20) {
      recentGenerations.value = recentGenerations.value.slice(0, 20)
    }
    
    // Save to localStorage
    localStorage.setItem('recentGenerations', JSON.stringify(recentGenerations.value))
    
    toast.success('Image generated successfully!')
    
  } catch (err: any) {
    console.error('Error generating image:', err)
    error.value = err.response?.data?.error || err.message || 'Failed to generate image'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

const copyImageUrl = async () => {
  if (!result.value?.imageUrl) return
  
  try {
    await navigator.clipboard.writeText(result.value.imageUrl)
    copied.value = true
    toast.success('Image URL copied to clipboard!')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    toast.error('Failed to copy URL')
  }
}

const downloadImage = () => {
  if (!result.value?.imageUrl) return
  
  const link = document.createElement('a')
  link.href = result.value.imageUrl
  link.download = result.value.fileName || `${form.value.productId}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const clearError = () => {
  error.value = ''
}

const handleImageError = () => {
  error.value = 'Failed to load generated image'
}

const loadGeneration = (item: any) => {
  form.value = {
    productId: item.productId || '',
    productType: item.productType || '',
    brand: item.brand || '',
    description: item.description || '',
    upc: item.upc || '',
    isbn: item.isbn || ''
  }
  
  result.value = {
    imageUrl: item.imageUrl,
    fileName: item.fileName || `${item.productId}.png`
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  // Load recent generations from localStorage
  try {
    const stored = localStorage.getItem('recentGenerations')
    if (stored) {
      recentGenerations.value = JSON.parse(stored).slice(0, 20)
    }
  } catch (err) {
    console.error('Error loading recent generations:', err)
  }
})
</script>