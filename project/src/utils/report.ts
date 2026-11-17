import { env } from '@/config/env'
import { ApiError } from '@/api/client'

export interface ReportContext {
  where: 'vue' | 'promise' | 'window' | 'boundary' | 'manual'
  info?: string
}

/**
 * 오류 보고 지점을 한 곳에 모은다 (study16).
 * - 개발: 콘솔 출력
 * - 운영: VITE_ERROR_REPORT_URL 이 있으면 sendBeacon 으로 전송 (Sentry 등으로 교체하기 쉽게 한 곳에만 둔다)
 * 토큰·비밀번호·개인정보는 payload 에 넣지 않는다.
 */
export function reportError(err: unknown, context: ReportContext) {
  const error = err instanceof Error ? err : new Error(String(err))
  const payload = {
    message: error.message,
    stack: error.stack,
    requestId: error instanceof ApiError ? error.requestId : undefined,
    status: error instanceof ApiError ? error.status : undefined,
    url: location.pathname, // 쿼리스트링에 민감 정보가 있을 수 있어 경로만 보낸다
    ...context,
  }

  if (env.isDev) console.error('[report]', payload)
  if (env.errorReportUrl && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(env.errorReportUrl, JSON.stringify(payload))
  }
}
