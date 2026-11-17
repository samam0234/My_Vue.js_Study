import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth.js'

function mockFetchOnce(status, body) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  )
}

describe('auth store (가상 로그인)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('이메일이 일치하는 사용자가 있으면 로그인된다', async () => {
    mockFetchOnce(200, [{ id: 1, name: 'Leanne', email: 'Sincere@april.biz' }])
    const auth = useAuthStore()

    const ok = await auth.login({ email: 'sincere@april.biz', password: 'test1234' })

    expect(ok).toBe(true)
    expect(auth.isLoggedIn).toBe(true)
    expect(auth.user.name).toBe('Leanne')
  })

  it('비밀번호가 8자 미만이면 요청 없이 실패한다', async () => {
    mockFetchOnce(200, [])
    const auth = useAuthStore()

    const ok = await auth.login({ email: 'a@b.com', password: 'short' })

    expect(ok).toBe(false)
    expect(auth.errorMessage).toContain('8자 이상')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('일치하는 계정이 없으면 안내 문구를 보여 준다', async () => {
    mockFetchOnce(200, [{ id: 1, name: 'x', email: 'x@y.com' }])
    const auth = useAuthStore()

    const ok = await auth.login({ email: 'nobody@y.com', password: 'longenough' })

    expect(ok).toBe(false)
    expect(auth.errorMessage).toContain('찾을 수 없습니다')
  })

  it('서버 오류(HTTP 500)도 오류 문구로 바뀐다', async () => {
    mockFetchOnce(500, {})
    const auth = useAuthStore()

    await auth.login({ email: 'a@b.com', password: 'longenough' })

    expect(auth.isLoggedIn).toBe(false)
    expect(auth.errorMessage).toContain('HTTP 500')
  })

  it('로그아웃하면 user 가 비워진다', async () => {
    mockFetchOnce(200, [{ id: 1, name: 'L', email: 'a@b.com' }])
    const auth = useAuthStore()
    await auth.login({ email: 'a@b.com', password: 'longenough' })

    auth.logout()

    expect(auth.isLoggedIn).toBe(false)
  })
})
