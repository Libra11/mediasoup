/*
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-04-30 15:10:56
 * @LastEditors: Libra
 * @Description:
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/room',
      name: 'room',
      component: () => import('../views/RoomView.vue')
    },
    {
      path: '/candidate',
      name: 'candidate',
      component: () => import('../views/CandidateView.vue')
    },
    {
      path: '/proctor',
      name: 'proctor',
      component: () => import('../views/ProctorView.vue')
    }
  ]
})

export default router
