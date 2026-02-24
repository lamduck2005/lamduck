import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/qr-code',
      name: 'QR Code',
      component: () => import('@/pages/tools/QrCode.vue')
    }
  ],
})

export default router
