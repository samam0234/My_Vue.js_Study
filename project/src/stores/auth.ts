import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { ApiError } from '@/api/client'
import { clearCache } from '@/api/cache'
import type { User } from '@/types/api'

export const TOKEN_KEY = 'mini-board:token'

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null // 저장소 접근이 막힌 환경에서도 앱이 시작되도록
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(readToken()) // 새로고침해도 토큰이 남아 있으면 복원 시도
  const loading = ref(false)
  const errorMessage = ref('')

  // 토큰만으로는 부족하다 — 서버가 사용자 정보까지 확인해 줘야 로그인으로 취급한다.
  const isLoggedIn = computed(() => !!token.value && user.value !== null)

  /** 메모리와 localStorage 를 한 곳에서 함께 갱신한다 (둘이 어긋나는 버그 방지). */
  function setSession(nextToken: string | null, nextUser: User | null) {
    token.value = nextToken
    user.value = nextUser
    try {
      if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* 저장 실패는 무시: 메모리 상태만으로도 동작한다 */
    }
  }

  async function login(input: { email: string; password: string }): Promise<boolean> {
    loading.value = true
    errorMessage.value = ''
    try {
      const result = await authApi.login(input)
      setSession(result.accessToken, result.user)
      return true
    } catch (err) {
      errorMessage.value =
        err instanceof ApiError && err.code === 'INVALID_CREDENTIALS'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : err instanceof Error
            ? err.message
            : '로그인에 실패했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 앱 시작 시 토큰이 남아 있으면 /me 로 아직 유효한지 서버에 확인한다. */
  async function restore() {
    if (!token.value) return
    try {
      user.value = await authApi.me()
    } catch {
      setSession(null, null) // 만료·위조 토큰은 정리한다
    }
  }

  /** 서버 응답 없이 로컬 세션만 정리한다 (401 처리용). */
  function clearSession() {
    setSession(null, null)
    clearCache()
  }

  async function logout() {
    const hadToken = !!token.value
    clearSession()
    if (hadToken) {
      // 토큰은 이미 지웠으므로 서버 호출은 베스트 에포트. 실패해도 로그아웃은 유효하다.
      await authApi.logout().catch(() => {})
    }
  }

  return { user, token, loading, errorMessage, isLoggedIn, login, restore, clearSession, logout }
})
