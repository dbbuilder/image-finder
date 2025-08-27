import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/Pricing.vue')
  },
  {
    path: '/docs',
    name: 'Documentation',
    component: () => import('@/views/Documentation.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/single',
    name: 'SingleImage',
    component: () => import('@/views/dashboard/SingleImage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/batch',
    name: 'BatchImages',
    component: () => import('@/views/dashboard/BatchImages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/history',
    name: 'ImageHistory',
    component: () => import('@/views/dashboard/ImageHistory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/billing',
    name: 'Billing',
    component: () => import('@/views/dashboard/Billing.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/features',
    name: 'Features',
    component: () => import('@/views/Features.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router