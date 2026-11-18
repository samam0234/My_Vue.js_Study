import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { configureApi } from '../api/client.js'
import { useAuthStore, TOKEN_KEY } from './auth.js'
import { useFavoritesStore } from './favorites.js'

function freshAuth() {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  configureApi({ getToken: () => auth.token })
  return auth
}

describe('auth store', () => {
  it('로그인하면 user·token 이 채워지고 localStorage 에 토큰이 저장된다', async () => {
    const auth = freshAuth()
    const ok = await auth.login({ email: 'mina@example.com', password: 'password123' })
    expect(ok).toBe(true)
    expect(auth.isLoggedIn).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe(auth.token)
  })

  it('비밀번호가 틀리면 안내 문구를 보여 주고 로그인되지 않는다', async () => {
    const auth = freshAuth()
    expect(await auth.login({ email: 'mina@example.com', password: 'wrong-password' })).toBe(false)
    expect(auth.errorMessage).toContain('올바르지 않습니다')
    expect(auth.isLoggedIn).toBe(false)
  })

  it('새로고침 뒤: 토큰이 남아 있으면 restore 로 로그인을 되살린다', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-2')
    const auth = freshAuth()
    expect(auth.isLoggedIn).toBe(false) // user 가 확인되기 전
    await auth.restore()
    expect(auth.user.nickname).toBe('joon')
  })

  it('위조 토큰이면 restore 가 세션을 정리한다', async () => {
    localStorage.setItem(TOKEN_KEY, 'forged')
    const auth = freshAuth()
    await auth.restore()
    expect(auth.token).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('로그아웃하면 메모리와 localStorage 가 비워진다', async () => {
    const auth = freshAuth()
    await auth.login({ email: 'mina@example.com', password: 'password123' })
    await auth.logout()
    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('favorites store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('toggle 하면 추가되고 다시 toggle 하면 제거된다', () => {
    const f = useFavoritesStore()
    f.toggle(3)
    expect(f.isFavorite(3)).toBe(true)
    f.toggle(3)
    expect(f.isFavorite(3)).toBe(false)
  })

  it('새로고침 뒤에도 유지된다 (watch + localStorage)', async () => {
    useFavoritesStore().toggle(1)
    await nextTick()
    setActivePinia(createPinia())
    expect(useFavoritesStore().isFavorite(1)).toBe(true)
  })

  it('저장값이 깨져 있어도 앱이 시작된다', () => {
    localStorage.setItem('mini-board:favorites', '{broken')
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual([])
  })
})
