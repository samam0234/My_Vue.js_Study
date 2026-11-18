import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { env } from './config/env.js'
import { configureApi } from './api/client.js'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 스토어·라우터를 API 클라이언트에 연결한다 (순환 import 를 피하는 주입 방식)
const auth = useAuthStore(pinia)
configureApi({
  getToken: () => auth.token,
  onUnauthorized: () => {
    auth.clearSession()
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  },
})

document.title = env.appTitle

// 라우터를 설치하면 첫 이동이 바로 시작되어 가드가 로그인 여부를 읽는다.
// 그래서 로그인 복원을 먼저 끝낸 뒤에 라우터를 설치한다.
auth.restore().then(async () => {
  app.use(router)
  await router.isReady()
  app.mount('#app')
})
