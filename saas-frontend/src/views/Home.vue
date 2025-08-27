<template>
  <div class="homepage">
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="text-center lg:text-left">
            <h1 class="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Generate Product Images 
              <span class="text-primary-200">Instantly</span>
            </h1>
            <p class="text-xl text-primary-100 mb-8 leading-relaxed">
              Transform your product catalog with AI-powered image generation. 
              Create professional product images from simple descriptions in seconds.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <router-link 
                to="/register" 
                class="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors inline-block text-center"
              >
                Start Free Trial
              </router-link>
              <router-link 
                to="/demo" 
                class="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-3 rounded-lg transition-colors inline-block text-center"
              >
                View Demo
              </router-link>
            </div>
          </div>
          
          <!-- Hero Image/Demo -->
          <div class="relative">
            <div class="bg-white rounded-lg shadow-2xl p-6">
              <div class="space-y-4">
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-sm text-gray-600 mb-2">Input:</div>
                  <div class="bg-white rounded border p-3 text-sm text-gray-800">
                    "15-inch gaming laptop, RTX graphics, black"
                  </div>
                </div>
                <div class="flex justify-center">
                  <ArrowDownIcon class="w-6 h-6 text-gray-400" />
                </div>
                <div class="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 aspect-square flex items-center justify-center">
                  <div class="text-center">
                    <PhotoIcon class="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <div class="text-sm text-gray-600">Generated Product Image</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Product Images
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            From single image generation to bulk processing, our API handles it all with enterprise-grade reliability.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="card text-center">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <SparklesIcon class="w-6 h-6 text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
            <p class="text-gray-600">
              Advanced AI creates realistic product images from text descriptions and product data.
            </p>
          </div>

          <div class="card text-center">
            <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BoltIcon class="w-6 h-6 text-success-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p class="text-gray-600">
              Generate professional product images in seconds, not hours. Perfect for real-time applications.
            </p>
          </div>

          <div class="card text-center">
            <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <QueueListIcon class="w-6 h-6 text-warning-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Batch Processing</h3>
            <p class="text-gray-600">
              Process thousands of products at once. Bulk upload CSVs and get all your images generated automatically.
            </p>
          </div>

          <div class="card text-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Enterprise Ready</h3>
            <p class="text-gray-600">
              99.9% uptime SLA, secure API authentication, and scalable infrastructure for any size business.
            </p>
          </div>

          <div class="card text-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CogIcon class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Easy Integration</h3>
            <p class="text-gray-600">
              RESTful API with comprehensive documentation. Get started in minutes with our SDKs and examples.
            </p>
          </div>

          <div class="card text-center">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CloudArrowUpIcon class="w-6 h-6 text-indigo-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Cloud Storage</h3>
            <p class="text-gray-600">
              All images stored securely in the cloud with global CDN delivery. Access your images anywhere.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p class="text-xl text-gray-600">
            Three simple steps to transform your product catalog
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-white">1</span>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Describe Your Product</h3>
            <p class="text-gray-600">
              Send product details via our API: name, description, category, brand, or even just a UPC/ISBN.
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-white">2</span>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">We Generate the Image</h3>
            <p class="text-gray-600">
              Our AI finds or creates the perfect image, adds watermarks, optimizes for web, and stores it securely.
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-white">3</span>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Get Your Image URL</h3>
            <p class="text-gray-600">
              Receive a permanent URL to your processed image. Use it in your app, website, or marketing materials.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Teaser Section -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p class="text-xl text-gray-600 mb-8">
            Pay only for what you use. No hidden fees, no surprises.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Starter Plan -->
          <div class="card text-center border-2 border-gray-200 hover:border-primary-300 transition-colors">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
            <div class="text-3xl font-bold text-gray-900 mb-4">
              $0<span class="text-base font-normal text-gray-600">/month</span>
            </div>
            <ul class="space-y-2 text-gray-600 mb-6">
              <li>100 images/month</li>
              <li>Basic API access</li>
              <li>Community support</li>
            </ul>
            <router-link to="/register" class="btn-secondary w-full">
              Start Free
            </router-link>
          </div>

          <!-- Pro Plan -->
          <div class="card-elevated text-center border-2 border-primary-300 relative">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
            <div class="text-3xl font-bold text-gray-900 mb-4">
              $29<span class="text-base font-normal text-gray-600">/month</span>
            </div>
            <ul class="space-y-2 text-gray-600 mb-6">
              <li>5,000 images/month</li>
              <li>Priority processing</li>
              <li>Batch upload</li>
              <li>Email support</li>
            </ul>
            <router-link to="/register" class="btn-primary w-full">
              Start Pro Trial
            </router-link>
          </div>

          <!-- Enterprise Plan -->
          <div class="card text-center border-2 border-gray-200 hover:border-primary-300 transition-colors">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
            <div class="text-3xl font-bold text-gray-900 mb-4">
              Custom
            </div>
            <ul class="space-y-2 text-gray-600 mb-6">
              <li>Unlimited images</li>
              <li>Custom integrations</li>
              <li>SLA guarantee</li>
              <li>Dedicated support</li>
            </ul>
            <button class="btn-secondary w-full">
              Contact Sales
            </button>
          </div>
        </div>

        <div class="text-center mt-12">
          <router-link to="/pricing" class="text-primary-600 hover:text-primary-700 font-semibold">
            View detailed pricing →
          </router-link>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-primary-600">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">
          Ready to Transform Your Product Images?
        </h2>
        <p class="text-xl text-primary-100 mb-8">
          Join thousands of businesses using our API to create stunning product images automatically.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link 
            to="/register" 
            class="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
          >
            Start Your Free Trial
          </router-link>
          <router-link 
            to="/docs" 
            class="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
          >
            View Documentation
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { 
  PhotoIcon, 
  SparklesIcon, 
  BoltIcon, 
  QueueListIcon,
  ShieldCheckIcon,
  CogIcon,
  CloudArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline'
</script>