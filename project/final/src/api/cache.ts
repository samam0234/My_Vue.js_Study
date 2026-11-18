// study11: TTL 캐시 + 진행 중 요청 공유(in-flight dedupe).
interface Entry {
  data: unknown
  at: number
}

interface Inflight {
  promise: Promise<unknown>
  signal?: AbortSignal
}

const store = new Map<string, Entry>()
const inflight = new Map<string, Inflight>()

export interface CachedOptions {
  /** 신선하다고 보는 시간(ms) */
  ttl?: number
  /** 이 요청이 취소 가능하다면 신호를 알려 준다. 취소된 요청의 Promise 는 다른 호출이 재사용하지 않는다. */
  signal?: AbortSignal
}

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttl = 30_000, signal }: CachedOptions = {},
): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.data as T // 신선: 네트워크 없음

  const running = inflight.get(key)
  if (running && !running.signal?.aborted) return running.promise as Promise<T> // 같은 요청이 진행 중이면 공유

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, at: Date.now() })
      return data
    })
    .finally(() => {
      if (inflight.get(key)?.promise === promise) inflight.delete(key)
    })

  inflight.set(key, { promise, signal })
  return promise
}

/** 변경(작성·수정·삭제) 뒤에는 관련 캐시를 폐기한다. */
export function invalidate(prefix: string) {
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k)
}

export function clearCache() {
  store.clear()
  inflight.clear()
}
