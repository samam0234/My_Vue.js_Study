import { env } from '@/config/env'
import type { ApiErrorBody } from '@/types/api'
import { isAbortError } from './abort'

/** 서버 오류를 화면이 분기할 수 있게 구조화한다 (status / code / fields / requestId). */
export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string[]>
  requestId?: string

  constructor(status: number, body: Partial<ApiErrorBody> & { message: string }) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code ?? 'UNKNOWN'
    this.fields = body.fields
    this.requestId = body.requestId
  }
}

interface ApiHooks {
  /** 현재 액세스 토큰. 있으면 Authorization 헤더를 붙인다. */
  getToken: () => string | null
  /** 로그인 상태에서 401 이 오면 호출된다 (토큰 폐기 + 로그인 화면 이동). */
  onUnauthorized: () => void
}

const hooks: ApiHooks = {
  getToken: () => null,
  onUnauthorized: () => {},
}

/** 스토어·라우터와의 순환 import 를 피하려고, 앱 시작 시 한 번 주입한다 (main.ts). */
export function configureApi(next: Partial<ApiHooks>) {
  Object.assign(hooks, next)
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** true 면 401 이어도 onUnauthorized 를 부르지 않는다 (로그인 요청 자체 등). */
  skipUnauthorizedHook?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, skipUnauthorizedHook = false } = options
  const token = hooks.getToken()

  let res: Response
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (isAbortError(err)) throw err
    throw new ApiError(0, { code: 'NETWORK', message: '서버에 연결할 수 없습니다.' })
  }

  if (res.status === 204) return null as T

  const json: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const e = (json as { error?: Partial<ApiErrorBody> } | null)?.error ?? {}
    const requestId = e.requestId ?? res.headers.get('X-Request-Id') ?? undefined
    const apiError = new ApiError(res.status, {
      code: e.code,
      message: e.message ?? `요청에 실패했습니다 (HTTP ${res.status})`,
      fields: e.fields,
      requestId,
    })
    if (res.status === 401 && token && !skipUnauthorizedHook) hooks.onUnauthorized()
    throw apiError
  }

  return json as T
}
