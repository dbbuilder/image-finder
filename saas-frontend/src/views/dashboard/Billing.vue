<template>
  <div class="billing-page">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <router-link 
              to="/dashboard" 
              class="text-gray-500 hover:text-gray-700 mr-4"
            >
              <ArrowLeftIcon class="w-5 h-5" />
            </router-link>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
              <p class="text-gray-600">Manage your subscription and billing information</p>
            </div>
          </div>
          <div class="flex space-x-3">
            <button 
              v-if="subscription.plan !== 'enterprise'"
              @click="showUpgradeModal = true"
              class="btn-primary"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Current Plan -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Subscription Overview -->
          <div class="card">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-gray-900">Current Subscription</h2>
              <div class="flex items-center space-x-2">
                <span 
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  :class="subscriptionStatusClass"
                >
                  <div class="w-2 h-2 rounded-full mr-2" :class="subscriptionStatusDotClass"></div>
                  {{ subscription.status }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center md:text-left">
                <p class="text-sm text-gray-600">Plan</p>
                <p class="text-2xl font-bold text-gray-900 capitalize">{{ subscription.plan }}</p>
              </div>
              <div class="text-center md:text-left">
                <p class="text-sm text-gray-600">Monthly Cost</p>
                <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(subscription.monthlyAmount) }}</p>
              </div>
              <div class="text-center md:text-left">
                <p class="text-sm text-gray-600">{{ subscription.plan === 'free' ? 'Resets' : 'Renews' }}</p>
                <p class="text-lg font-semibold text-gray-900">{{ formatDate(subscription.nextBilling) }}</p>
              </div>
            </div>

            <!-- Usage Progress -->
            <div class="mt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Images Used This Month</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ usage.current }} / {{ usage.limit === -1 ? '∞' : usage.limit }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min((usage.current / (usage.limit || 100)) * 100, 100)}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>{{ usage.daysLeft }} days left in cycle</span>
                <span v-if="usage.limit !== -1">{{ usage.limit - usage.current }} remaining</span>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Payment Method</h2>
              <button 
                @click="showPaymentModal = true"
                class="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {{ paymentMethod ? 'Update' : 'Add' }} Payment Method
              </button>
            </div>

            <div v-if="paymentMethod" class="flex items-center space-x-4">
              <div class="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                <CreditCardIcon class="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">•••• •••• •••• {{ paymentMethod.last4 }}</p>
                <p class="text-sm text-gray-600">{{ paymentMethod.brand }} • Expires {{ paymentMethod.expiry }}</p>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <CreditCardIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-600 mb-4">No payment method on file</p>
              <button 
                @click="showPaymentModal = true"
                class="btn-primary"
              >
                Add Payment Method
              </button>
            </div>
          </div>

          <!-- Billing History -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Billing History</h2>
            </div>

            <div v-if="invoices.length === 0" class="text-center py-8">
              <DocumentIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-600">No invoices yet</p>
            </div>

            <div v-else class="space-y-4">
              <div 
                v-for="invoice in invoices" 
                :key="invoice.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div class="flex items-center space-x-4">
                  <div 
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    :class="invoice.status === 'paid' ? 'bg-green-100' : 'bg-red-100'"
                  >
                    <CheckIcon v-if="invoice.status === 'paid'" class="w-5 h-5 text-green-600" />
                    <ExclamationTriangleIcon v-else class="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ formatCurrency(invoice.amount) }}</p>
                    <p class="text-sm text-gray-600">{{ formatDate(invoice.date) }} • {{ invoice.status }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <a 
                    :href="invoice.invoiceUrl" 
                    target="_blank"
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Usage Stats -->
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
            
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">This Month</span>
                <span class="text-sm font-medium text-gray-900">{{ usage.current }} images</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Last Month</span>
                <span class="text-sm font-medium text-gray-900">{{ usage.lastMonth }} images</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Total Generated</span>
                <span class="text-sm font-medium text-gray-900">{{ usage.total }} images</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Success Rate</span>
                <span class="text-sm font-medium text-gray-900">{{ usage.successRate }}%</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div class="space-y-3">
              <button 
                v-if="subscription.plan !== 'enterprise'"
                @click="showUpgradeModal = true"
                class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center">
                  <ArrowUpIcon class="w-5 h-5 text-primary-600 mr-3" />
                  <span class="font-medium text-gray-900">Upgrade Plan</span>
                </div>
                <p class="text-sm text-gray-600 ml-8">Get more images and features</p>
              </button>

              <button 
                @click="showPaymentModal = true"
                class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center">
                  <CreditCardIcon class="w-5 h-5 text-gray-600 mr-3" />
                  <span class="font-medium text-gray-900">Payment Methods</span>
                </div>
                <p class="text-sm text-gray-600 ml-8">Manage billing information</p>
              </button>

              <a 
                href="mailto:billing@imageapi.com"
                class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
              >
                <div class="flex items-center">
                  <ChatBubbleLeftEllipsisIcon class="w-5 h-5 text-gray-600 mr-3" />
                  <span class="font-medium text-gray-900">Contact Billing</span>
                </div>
                <p class="text-sm text-gray-600 ml-8">Get help with your account</p>
              </a>
            </div>
          </div>

          <!-- Plan Benefits -->
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {{ subscription.plan === 'free' ? 'Free Plan' : 
                 subscription.plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan' }} Benefits
            </h3>
            
            <div class="space-y-2">
              <div 
                v-for="benefit in currentPlanBenefits" 
                :key="benefit"
                class="flex items-start"
              >
                <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span class="text-sm text-gray-600">{{ benefit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade Modal -->
    <div v-if="showUpgradeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <button 
              @click="showUpgradeModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Pricing Plans -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Free Plan -->
            <div class="border border-gray-200 rounded-lg p-6" :class="{ 'border-primary-300 bg-primary-50': subscription.plan === 'free' }">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Free</h3>
              <div class="text-3xl font-bold text-gray-900 mb-4">$0<span class="text-sm font-normal text-gray-600">/month</span></div>
              <ul class="space-y-2 mb-6">
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">100 images/month</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Basic API access</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Community support</span>
                </li>
              </ul>
              <button 
                v-if="subscription.plan !== 'free'"
                @click="changePlan('free')"
                class="btn-secondary w-full"
              >
                Downgrade to Free
              </button>
              <div v-else class="btn-secondary w-full text-center opacity-50 cursor-not-allowed">
                Current Plan
              </div>
            </div>

            <!-- Pro Plan -->
            <div class="border-2 border-primary-300 rounded-lg p-6 relative" :class="{ 'bg-primary-50': subscription.plan === 'pro' }">
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Pro</h3>
              <div class="text-3xl font-bold text-gray-900 mb-4">$29<span class="text-sm font-normal text-gray-600">/month</span></div>
              <ul class="space-y-2 mb-6">
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">5,000 images/month</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Priority processing</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Batch upload</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Email support</span>
                </li>
              </ul>
              <button 
                v-if="subscription.plan !== 'pro'"
                @click="changePlan('pro')"
                class="btn-primary w-full"
                :disabled="upgrading"
              >
                {{ upgrading ? 'Processing...' : subscription.plan === 'free' ? 'Upgrade to Pro' : 'Switch to Pro' }}
              </button>
              <div v-else class="btn-primary w-full text-center opacity-50 cursor-not-allowed">
                Current Plan
              </div>
            </div>

            <!-- Enterprise Plan -->
            <div class="border border-gray-200 rounded-lg p-6" :class="{ 'border-primary-300 bg-primary-50': subscription.plan === 'enterprise' }">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
              <div class="text-3xl font-bold text-gray-900 mb-4">Custom</div>
              <ul class="space-y-2 mb-6">
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Unlimited images</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Custom integrations</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">SLA guarantee</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Dedicated support</span>
                </li>
              </ul>
              <button 
                v-if="subscription.plan !== 'enterprise'"
                class="btn-secondary w-full"
              >
                Contact Sales
              </button>
              <div v-else class="btn-secondary w-full text-center opacity-50 cursor-not-allowed">
                Current Plan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Method Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900">Payment Method</h2>
            <button 
              @click="showPaymentModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <div class="text-center py-8">
            <CreditCardIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-600 mb-4">Payment method integration would be implemented here using Stripe Elements or similar.</p>
            <button 
              @click="showPaymentModal = false"
              class="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import { 
  ArrowLeftIcon,
  CreditCardIcon,
  DocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const showUpgradeModal = ref(false)
const showPaymentModal = ref(false)
const upgrading = ref(false)

const subscription = ref({
  plan: 'pro',
  status: 'active',
  monthlyAmount: 29.00,
  nextBilling: new Date('2024-02-15')
})

const usage = ref({
  current: 1247,
  limit: 5000,
  lastMonth: 2156,
  total: 12847,
  successRate: 98,
  daysLeft: 12
})

const paymentMethod = ref({
  brand: 'Visa',
  last4: '4242',
  expiry: '12/26'
})

const invoices = ref([
  {
    id: '1',
    amount: 29.00,
    date: new Date('2024-01-15'),
    status: 'paid',
    invoiceUrl: '#'
  },
  {
    id: '2',
    amount: 29.00,
    date: new Date('2023-12-15'),
    status: 'paid',
    invoiceUrl: '#'
  },
  {
    id: '3',
    amount: 29.00,
    date: new Date('2023-11-15'),
    status: 'paid',
    invoiceUrl: '#'
  }
])

const subscriptionStatusClass = computed(() => {
  switch (subscription.value.status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'past_due':
      return 'bg-red-100 text-red-800'
    case 'canceled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
})

const subscriptionStatusDotClass = computed(() => {
  switch (subscription.value.status) {
    case 'active':
      return 'bg-green-500'
    case 'past_due':
      return 'bg-red-500'
    case 'canceled':
      return 'bg-gray-500'
    default:
      return 'bg-yellow-500'
  }
})

const currentPlanBenefits = computed(() => {
  switch (subscription.value.plan) {
    case 'free':
      return [
        '100 images per month',
        'Basic API access',
        'Community support',
        'Standard processing speed'
      ]
    case 'pro':
      return [
        '5,000 images per month',
        'Priority processing',
        'Batch upload feature',
        'Email support',
        'Advanced API features'
      ]
    case 'enterprise':
      return [
        'Unlimited images',
        'Custom integrations',
        '99.9% SLA guarantee',
        'Dedicated support',
        'Custom branding options',
        'Advanced analytics'
      ]
    default:
      return []
  }
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const changePlan = async (newPlan: string) => {
  upgrading.value = true
  
  try {
    // TODO: Implement actual plan change API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    subscription.value.plan = newPlan
    subscription.value.monthlyAmount = newPlan === 'free' ? 0 : newPlan === 'pro' ? 29 : 99
    
    showUpgradeModal.value = false
    toast.success(`Successfully ${newPlan === 'free' ? 'downgraded' : 'upgraded'} to ${newPlan} plan!`)
    
  } catch (error) {
    toast.error('Failed to change plan. Please try again.')
  } finally {
    upgrading.value = false
  }
}

onMounted(() => {
  // Load billing data
  console.log('Loading billing information...')
})
</script>