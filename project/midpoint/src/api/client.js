import { env } from '../config/env.js'

// study6: 서버 오류를 화면이 분기할 수 있게 구조화한다 (status / code / fields / requestId).
export class ApiError extends Error {
  constructor(status, { code, message, fields, requestId }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code ?? 'UNKNOWN'
    this.fields = fields
    this.requestId = requestId
  }
}

// study7: 스토어와 순환 import 하지 않도록 토큰과 401 처리를 main.js 에서 주입한다.
const hooks = { getToken: () => null, onUnauthorized: () => {} }
export function configureApi(next) {
  Object.assign(hooks, next)
}

export async function request(path, { method = 'GET', body, skipUnauthorizedHook = false } = {}) {
  const token = hooks.getToken()
  let res
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { code: 'NETWORK', message: '서버에 연결할 수 없습니다.' })
  }

  if (res.status === 204) return null // 삭제 성공 등 본문 없음

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const e = json?.error ?? {}
    const error = new ApiError(res.status, {
      code: e.code,
      message: e.message ?? `요청에 실패했습니다 (HTTP ${res.status})`,
      fields: e.fields,
      requestId: e.requestId ?? res.headers.get('X-Request-Id') ?? undefined,
    })
    if (res.status === 401 && token && !skipUnauthorizedHook) hooks.onUnauthorized()
    throw error
  }
  return json
}
