import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { rejection } from '@/test/helpers'
import { request, ApiError, configureApi } from './client'

const BASE = 'http://localhost:3000'

describe('api client', () => {
  it('성공 응답은 JSON 을 그대로 돌려준다', async () => {
    const res = await request<{ data: unknown[] }>('/api/posts')
    expect(Array.isArray(res.data)).toBe(true)
  })

  it('204 는 본문 없이 null 을 돌려준다', async () => {
    configureApi({ getToken: () => 'mock-token-1' })
    await expect(request<null>('/api/auth/logout', { method: 'POST' })).resolves.toBeNull()
  })

  it('서버 오류를 ApiError 로 구조화한다 (status / code / fields / requestId)', async () => {
    server.use(
      http.post(`${BASE}/api/auth/signup`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: '입력값을 확인하세요.',
              fields: { email: ['형식 오류'] },
              requestId: 'req-1',
            },
          },
          { status: 400 },
        ),
      ),
    )

    const err = await rejection(request('/api/auth/signup', { method: 'POST', body: {} }))

    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: { email: ['형식 오류'] },
      requestId: 'req-1',
    })
  })

  it('JSON 이 아닌 오류 응답도 앱이 죽지 않고 ApiError 가 된다', async () => {
    server.use(
      http.get(`${BASE}/api/posts`, () => new HttpResponse('<html>Bad</html>', { status: 502 })),
    )
    const err = await rejection(request('/api/posts'))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(502)
    expect(err.code).toBe('UNKNOWN')
  })

  it('네트워크 오류는 status 0 / NETWORK 로 통일한다', async () => {
    server.use(http.get(`${BASE}/api/posts`, () => HttpResponse.error()))
    const err = await rejection(request('/api/posts'))
    expect(err).toMatchObject({ status: 0, code: 'NETWORK' })
  })

  it('토큰이 있으면 Authorization 헤더를 붙인다', async () => {
    let header: string | null = null
    server.use(
      http.get(`${BASE}/api/auth/me`, ({ request }) => {
        header = request.headers.get('Authorization')
        return HttpResponse.json({ data: { id: 1, email: 'a@b.c', nickname: 'a' } })
      }),
    )
    configureApi({ getToken: () => 'abc' })
    await request('/api/auth/me')
    expect(header).toBe('Bearer abc')
  })

  it('로그인 상태에서 401 이 오면 onUnauthorized 를 호출한다', async () => {
    const onUnauthorized = vi.fn()
    configureApi({ getToken: () => 'expired', onUnauthorized })
    await rejection(request('/api/auth/me'))
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('skipUnauthorizedHook 이면 401 이어도 훅을 부르지 않는다', async () => {
    const onUnauthorized = vi.fn()
    configureApi({ getToken: () => 'expired', onUnauthorized })
    await rejection(request('/api/auth/me', { skipUnauthorizedHook: true }))
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('취소된 요청은 AbortError 를 그대로 던진다', async () => {
    const controller = new AbortController()
    const promise = request('/api/posts', { signal: controller.signal })
    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })
})
