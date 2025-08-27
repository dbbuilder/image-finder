import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 3000,
  hideProgressBar: false,
  closeButton: false,
  position: 'top-right',
  theme: 'auto'
})

app.mount('#app')