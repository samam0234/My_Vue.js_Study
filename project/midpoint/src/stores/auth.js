import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '../api/auth.js'

export const TOKEN_KEY = 'mini-board:token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem(TOKEN_KEY)) // 새로고침해도 토큰이 남아 있으면 복원 시도
  const loading = ref(false)
  const errorMessage = ref('')

  // 토큰만으로는 부족하다 — 서버가 사용자 정보까지 확인해 줘야 로그인으로 취급한다.
  const isLoggedIn = computed(() => !!token.value && user.value !== null)

  // 메모리와 localStorage 를 한 곳에서 함께 갱신한다
  function setSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
  }

  async function login({ email, password }) {
    loading.value = true
    errorMessage.value = ''
    try {
      const result = await authApi.login({ email, password })
      setSession(result.accessToken, result.user)
      return true
    } catch (err) {
      errorMessage.value =
        err.code === 'INVALID_CREDENTIALS'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // 앱 시작 시 토큰이 남아 있으면 /me 로 아직 유효한지 서버에 확인한다
  async function restore() {
    if (!token.value) return
    try {
      user.value = await authApi.me()
    } catch {
      setSession(null, null)
    }
  }

  function clearSession() {
    setSession(null, null)
  }

  async function logout() {
    const hadToken = !!token.value
    clearSession()
    if (hadToken) await authApi.logout().catch(() => {})
  }

  return { user, token, loading, errorMessage, isLoggedIn, login, restore, clearSession, logout }
})
