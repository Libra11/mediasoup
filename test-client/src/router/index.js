/*
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-04-29 22:56:33
 * @LastEditors: Libra
 * @Description:
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
