import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { env } from '../config/env.js'

export const routes = [
  { path: '/', name: 'post-list', component: () => import('../views/PostListView.vue') },
  // '/posts/:id' 보다 먼저 둔다 ('new' 가 id 로 해석되지 않게)
  {
    path: '/posts/new',
    name: 'post-new',
    component: () => import('../views/PostFormView.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/posts/:id', name: 'post-detail', component: () => import('../views/PostDetailView.vue') },
  {
    path: '/posts/:id/edit',
    name: 'post-edit',
    component: () => import('../views/PostFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SignupView.vue'),
    meta: { guestOnly: true },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
]

// 가드 안에서 스토어를 호출한다 (모듈 최상단에서 부르면 Pinia 가 설치되기 전일 수 있다)
export function installGuards(router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } } // 돌아올 주소를 기억한다
    }
    if (to.meta.guestOnly && auth.isLoggedIn) return { name: 'post-list' }
  })
}

const router = createRouter({
  history: createWebHistory(env.baseUrl),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})
installGuards(router)

export default router
