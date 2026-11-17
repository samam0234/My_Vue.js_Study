import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { configureApi } from './api/client'
import { useAuthStore } from './stores/auth'
import { reportError } from './utils/report'

async function bootstrap() {
  // 백엔드 없이 개발·E2E: MSW 목 서버로 /api 요청을 가로챈다.
  // 빌드 시점에 값이 치환되어 운영 빌드(VITE_ENABLE_MOCK=false)에서는 이 블록과 mocks/ 코드가 번들에서 통째로 사라진다.
  // (config/env.ts 를 거치면 정적 제거가 안 되므로 여기서만 import.meta.env 를 직접 읽는다.)
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const { startMockWorker } = await import('./mocks/browser')
    await startMockWorker()
  }

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // study16: 전역 오류 처리 — 화면이 죽지 않게 하고 한 곳으로 보고한다.
  app.config.errorHandler = (err, _instance, info) => reportError(err, { where: 'vue', info })
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { where: 'promise' }))
  window.addEventListener('error', (e) => reportError(e.error ?? e.message, { where: 'window' }))

  // 스토어·라우터를 API 클라이언트에 연결한다 (순환 import 를 피하려는 주입 방식).
  const auth = useAuthStore(pinia)
  configureApi({
    getToken: () => auth.token,
    onUnauthorized: () => {
      auth.clearSession()
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    },
  })

  // 라우터를 설치하면 첫 이동이 바로 시작되어 가드가 로그인 여부를 읽는다.
  // 그래서 로그인 복원을 먼저 끝낸 뒤에 라우터를 설치한다.
  await auth.restore()
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap()
