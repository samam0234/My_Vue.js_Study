import { ref, nextTick, effectScope } from 'vue'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { useAsync } from './useAsync'
import { useDebouncedRef } from './useDebounce'
import { useLatestRequest } from './useLatestRequest'
import { useStreamSummary } from './useStreamSummary'

describe('useAsync', () => {
  it('성공하면 data 를 채우고 loading 을 끈다', async () => {
    const { data, loading, error, run } = useAsync(async (n: number) => n * 2)
    const promise = run(21)
    expect(loading.value).toBe(true)
    await promise
    expect(data.value).toBe(42)
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('실패하면 error 에 담고 예외를 밖으로 던지지 않는다', async () => {
    const { data, loading, error, run } = useAsync(async () => {
      throw new Error('boom')
    })
    await run()
    expect(error.value?.message).toBe('boom')
    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('다시 실행하면 이전 오류를 지운다', async () => {
    let fail = true
    const { error, run } = useAsync(async () => {
      if (fail) throw new Error('x')
      return 1
    })
    await run()
    fail = false
    await run()
    expect(error.value).toBeNull()
  })
})

describe('useDebouncedRef', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('입력이 멈춘 뒤에만 값이 따라온다', async () => {
    const scope = effectScope()
    const source = ref('')
    const debounced = scope.run(() => useDebouncedRef(source, 300))!

    source.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(200)
    source.value = 'ab'
    await nextTick()
    vi.advanceTimersByTime(200)
    expect(debounced.value).toBe('') // 아직 300ms 가 지나지 않았다

    vi.advanceTimersByTime(150)
    expect(debounced.value).toBe('ab') // 마지막 값만 반영
    scope.stop()
  })
})

describe('useLatestRequest', () => {
  it('새 요청을 시작하면 이전 요청은 취소되어 undefined 를 돌려준다', async () => {
    const run = useLatestRequest()
    const slow = run(
      (signal) =>
        new Promise<string>((resolve, reject) => {
          const t = setTimeout(() => resolve('slow'), 50)
          signal.addEventListener('abort', () => {
            clearTimeout(t)
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    )
    const fast = run(async () => 'fast')

    expect(await fast).toBe('fast')
    expect(await slow).toBeUndefined()
  })

  it('AbortError 가 아닌 오류는 그대로 던진다', async () => {
    const run = useLatestRequest()
    await expect(run(async () => Promise.reject(new Error('x')))).rejects.toThrow('x')
  })
})

describe('useStreamSummary', () => {
  it('스트림 조각을 차례로 이어 붙인다', async () => {
    const { text, loading, error, start } = useStreamSummary(() => 'mock-token-1')

    const promise = start('요약할 본문입니다')
    expect(loading.value).toBe(true)
    await promise

    expect(text.value).toContain('[목 요약]')
    expect(text.value).toContain('내용입니다.')
    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('로그인하지 않으면 안내 문구를 error 로 보여 준다', async () => {
    const { text, error, start } = useStreamSummary(() => null)
    await start('본문')
    expect(text.value).toBe('')
    expect(error.value).toContain('로그인')
  })

  it('서버가 보낸 오류 이벤트를 error 로 보여 준다', async () => {
    server.use(
      http.post('*/api/ai/summarize/stream', () => {
        const body = `data: ${JSON.stringify({ error: 'AI 요청에 실패했습니다.' })}\n\n`
        return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } })
      }),
    )
    const { error, start } = useStreamSummary(() => 'mock-token-1')
    await start('본문')
    expect(error.value).toBe('AI 요청에 실패했습니다.')
  })

  it('stop 하면 진행 중인 요약을 중단한다', async () => {
    const { loading, error, start, stop } = useStreamSummary(() => 'mock-token-1')
    const promise = start('본문')
    stop()
    await promise
    expect(loading.value).toBe(false)
    expect(error.value).toBe('') // 사용자가 멈춘 것은 오류가 아니다
  })
})
