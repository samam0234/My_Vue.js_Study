import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { routes, installGuards } from '@/router'
import { configureApi, type ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

/** 실제 라우트·가드를 쓰되, 주소창 대신 메모리 히스토리를 쓰는 테스트용 라우터. */
export function createTestRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  installGuards(router)
  return router
}

/** main.ts 와 같은 방식으로 스토어를 API 클라이언트에 연결한다. */
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore(pinia)
  configureApi({
    getToken: () => auth.token,
    onUnauthorized: () => auth.clearSession(),
  })
  return { pinia, auth }
}

export async function signIn(email = 'mina@example.com', password = 'password123') {
  const ctx = createTestPinia()
  const ok = await ctx.auth.login({ email, password })
  if (!ok) throw new Error(`테스트 로그인 실패: ${ctx.auth.errorMessage}`)
  return ctx
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 비동기 작업(지연 import, fetch, 렌더)이 가라앉을 때까지 기다린다.
 * flushPromises 는 마이크로태스크만 비우므로, 타이머를 쓰는 MSW 응답까지 기다리려면 짧게 몇 번 쉬어 준다.
 */
export async function settle(rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await sleep(15)
    await flushPromises()
  }
}

/** 앱 전체(App.vue + 라우터 + Pinia)를 마운트하고 해당 주소로 이동한다. */
export async function mountApp(path = '/', ctx = createTestPinia()) {
  const router = createTestRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [ctx.pinia, router] } })
  await settle()
  return { wrapper, router, ...ctx }
}

/** 실패해야 하는 Promise 의 오류를 꺼낸다. 성공하면 테스트가 실패한다. */
export async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (err) {
    return err as ApiError
  }
  throw new Error('Promise 가 reject 되어야 합니다.')
}
