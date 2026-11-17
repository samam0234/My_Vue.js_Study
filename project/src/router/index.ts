import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/config/env'

declare module 'vue-router' {
  interface RouteMeta {
    /** 로그인이 필요한 화면 */
    requiresAuth?: boolean
    /** 로그인한 사용자는 들어올 필요가 없는 화면 (로그인·회원가입) */
    guestOnly?: boolean
    title?: string
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'post-list',
    component: () => import('@/views/PostListView.vue'),
    meta: { title: '게시글' },
  },
  {
    // '/posts/:id' 보다 먼저 둔다 ('new' 가 id 로 해석되지 않게)
    path: '/posts/new',
    name: 'post-new',
    component: () => import('@/views/PostFormView.vue'),
    meta: { requiresAuth: true, title: '글쓰기' },
  },
  {
    path: '/posts/:id',
    name: 'post-detail',
    component: () => import('@/views/PostDetailView.vue'),
    meta: { title: '게시글' },
  },
  {
    path: '/posts/:id/edit',
    name: 'post-edit',
    component: () => import('@/views/PostFormView.vue'),
    meta: { requiresAuth: true, title: '글 수정' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: '로그인' },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignupView.vue'),
    meta: { guestOnly: true, title: '회원가입' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음' },
  },
]

// 가드 안에서 스토어를 호출한다 (모듈 최상단에서 부르면 Pinia 가 설치되기 전일 수 있다).
export function installGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } } // 돌아올 주소를 기억한다
    }
    if (to.meta.guestOnly && auth.isLoggedIn) {
      return { name: 'post-list' }
    }
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · ${env.appTitle}` : env.appTitle
  })
}

const router = createRouter({
  history: createWebHistory(env.baseUrl),
  scrollBehavior() {
    return { top: 0 }
  },
  routes,
})
installGuards(router)

export default router
