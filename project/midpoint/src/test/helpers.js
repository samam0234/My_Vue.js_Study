import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import { routes, installGuards } from '../router/index.js'
import { configureApi } from '../api/client.js'
import { useAuthStore } from '../stores/auth.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 지연 import · fetch · 렌더가 가라앉을 때까지 기다린다
export async function settle(rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await sleep(15)
    await flushPromises()
  }
}

// main.js 와 같은 방식으로 스토어를 API 클라이언트에 연결한다
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore(pinia)
  configureApi({ getToken: () => auth.token, onUnauthorized: () => auth.clearSession() })
  return { pinia, auth }
}

export async function signIn(email = 'mina@example.com', password = 'password123') {
  const ctx = createTestPinia()
  if (!(await ctx.auth.login({ email, password }))) throw new Error(ctx.auth.errorMessage)
  return ctx
}

export async function mountApp(path = '/', ctx = createTestPinia()) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  installGuards(router)
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [ctx.pinia, router] } })
  await settle()
  return { wrapper, router, ...ctx }
}

export function field(wrapper, label) {
  const l = wrapper.findAll('label').find((el) => el.text() === label)
  if (!l) throw new Error(`label "${label}" 을 찾지 못했습니다.`)
  return wrapper.get(`[id="${l.attributes('for')}"]`)
}

export function button(wrapper, text) {
  const b = wrapper.findAll('button').find((el) => el.text().includes(text))
  if (!b) throw new Error(`button "${text}" 을 찾지 못했습니다.`)
  return b
}
