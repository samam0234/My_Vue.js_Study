import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// study6에서 배운 fetch 패턴을 그대로 로그인 로직 안에서 사용합니다.
// 실제 로그인 서버가 없으므로, JSONPlaceholder의 사용자 목록에서
// 입력한 이메일과 일치하는 사용자를 찾으면 "로그인 성공"으로 취급합니다.
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const errorMessage = ref('')

  const isLoggedIn = computed(() => user.value !== null)

  async function login({ email, password }) {
    loading.value = true
    errorMessage.value = ''

    try {
      if (!password || password.length < 8) {
        throw new Error('비밀번호는 8자 이상이어야 합니다.')
      }

      const res = await fetch('https://jsonplaceholder.typicode.com/users')
      if (!res.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
      }

      const users = await res.json()
      const found = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      )

      if (!found) {
        throw new Error('일치하는 계정을 찾을 수 없습니다.')
      }

      user.value = found
      return true
    } catch (err) {
      errorMessage.value = err.message || '로그인에 실패했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
  }

  return { user, loading, errorMessage, isLoggedIn, login, logout }
})
