import { server } from '@/mocks/server'
import { resetDb } from '@/mocks/db'
import { clearCache } from '@/api/cache'
import { configureApi } from '@/api/client'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' })) // 정의하지 않은 요청은 실패
beforeEach(() => {
  // 테스트마다 API 훅을 초기화한다 (토큰 없음, 401 처리 없음).
  configureApi({ getToken: () => null, onUnauthorized: () => {} })
})
afterEach(() => {
  server.resetHandlers()
  resetDb()
  clearCache()
  localStorage.clear()
})
afterAll(() => server.close())
