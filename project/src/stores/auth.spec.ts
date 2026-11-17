import { createPinia, setActivePinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { configureApi } from '@/api/client'
import { useAuthStore, TOKEN_KEY } from './auth'

function freshStore() {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  configureApi({ getToken: () => auth.token })
  return auth
}

describe('auth store', () => {
  it('로그인에 성공하면 user·token 이 채워지고 localStorage 에 토큰이 저장된다', async () => {
    const auth = freshStore()

    const ok = await auth.login({ email: 'mina@example.com', password: 'password123' })

    expect(ok).toBe(true)
    expect(auth.isLoggedIn).toBe(true)
    expect(auth.user?.nickname).toBe('mina')
    expect(localStorage.getItem(TOKEN_KEY)).toBe(auth.token)
  })

  it('INVALID_CREDENTIALS 면 안내 문구를 보여 주고 로그인되지 않는다', async () => {
    const auth = freshStore()

    const ok = await auth.login({ email: 'mina@example.com', password: 'wrong-password' })

    expect(ok).toBe(false)
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.errorMessage).toContain('올바르지 않습니다')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('요청이 끝나면 loading 이 false 로 돌아온다', async () => {
    const auth = freshStore()
    const promise = auth.login({ email: 'mina@example.com', password: 'password123' })
    expect(auth.loading).toBe(true)
    await promise
    expect(auth.loading).toBe(false)
  })

  it('새로고침 뒤: 토큰이 남아 있으면 restore 로 로그인 상태를 되살린다', async () => {
    localStorage.setItem(TOKEN_KEY, 'mock-token-2')
    const auth = freshStore() // 저장된 토큰을 읽어 시작

    expect(auth.isLoggedIn).toBe(false) // user 가 확인되기 전에는 로그인으로 보지 않는다
    await auth.restore()

    expect(auth.isLoggedIn).toBe(true)
    expect(auth.user?.nickname).toBe('joon')
  })

  it('만료·위조 토큰이면 restore 가 세션을 정리한다', async () => {
    localStorage.setItem(TOKEN_KEY, 'forged')
    const auth = freshStore()

    await auth.restore()

    expect(auth.isLoggedIn).toBe(false)
    expect(auth.token).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('로그아웃하면 메모리와 localStorage 가 모두 비워진다 (서버 호출이 실패해도)', async () => {
    const auth = freshStore()
    await auth.login({ email: 'mina@example.com', password: 'password123' })
    server.use(http.post('*/api/auth/logout', () => HttpResponse.error()))

    await auth.logout()

    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
