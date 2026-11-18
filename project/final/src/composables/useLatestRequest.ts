import { isAbortError } from '@/api/abort'

/**
 * 새 요청을 시작하면 이전 요청을 취소해 경쟁 상태(race)를 막는다 (study11).
 * 취소된 호출은 undefined 를 돌려주므로 호출한 쪽은 결과가 있을 때만 화면을 갱신한다.
 */
export function useLatestRequest() {
  let controller: AbortController | null = null

  return async function run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    controller?.abort()
    const current = new AbortController()
    controller = current
    try {
      return await fn(current.signal)
    } catch (err) {
      if (isAbortError(err)) return undefined
      throw err
    }
  }
}
