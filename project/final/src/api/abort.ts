/**
 * AbortController 로 취소된 요청인지 판별한다.
 * instanceof DOMException 대신 name 으로 확인한다 — 환경(브라우저·jsdom·Node)마다 DOMException 클래스가 달라
 * instanceof 가 실패할 수 있다.
 */
export function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError'
  )
}
