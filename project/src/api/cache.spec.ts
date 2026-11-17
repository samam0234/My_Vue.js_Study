import { cached, invalidate } from './cache'

describe('cached', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('TTL 안에서는 fetcher 를 다시 부르지 않는다', async () => {
    const fetcher = vi.fn().mockResolvedValue('a')
    await cached('k', fetcher, { ttl: 1000 })
    await cached('k', fetcher, { ttl: 1000 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('TTL 이 지나면 다시 요청한다', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b')
    await cached('k', fetcher, { ttl: 1000 })
    vi.advanceTimersByTime(1500)
    await expect(cached('k', fetcher, { ttl: 1000 })).resolves.toBe('b')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('같은 키의 동시 요청은 하나로 합친다 (in-flight 공유)', async () => {
    const fetcher = vi.fn().mockResolvedValue('a')
    const [x, y] = await Promise.all([cached('k', fetcher), cached('k', fetcher)])
    expect([x, y]).toEqual(['a', 'a'])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('실패는 캐시하지 않는다', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('ok')
    await expect(cached('k', fetcher)).rejects.toThrow('x')
    await expect(cached('k', fetcher)).resolves.toBe('ok')
  })

  it('invalidate 는 접두어가 같은 캐시만 지운다', async () => {
    const a = vi.fn().mockResolvedValue('a')
    const b = vi.fn().mockResolvedValue('b')
    await cached('posts:1', a)
    await cached('post:1', b)
    invalidate('posts:')
    await cached('posts:1', a)
    await cached('post:1', b)
    expect(a).toHaveBeenCalledTimes(2)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('취소된 진행 중 요청은 다른 호출이 재사용하지 않는다', async () => {
    const controller = new AbortController()
    const first = vi.fn(
      () =>
        new Promise<string>((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new DOMException('x', 'AbortError')),
          )
        }),
    )
    const second = vi.fn().mockResolvedValue('fresh')

    const p1 = cached('k', first, { signal: controller.signal })
    p1.catch(() => {})
    controller.abort()

    await expect(cached('k', second)).resolves.toBe('fresh')
  })
})
