import { ref, nextTick, effectScope } from 'vue'
import { useAsync } from '../useAsync.js'
import { useDebouncedRef } from '../useDebounce.js'

describe('useAsync', () => {
  it('성공하면 data 를 채우고 loading 을 끈다', async () => {
    const { data, loading, error, run } = useAsync(async (n) => n * 2)
    const promise = run(21)
    expect(loading.value).toBe(true)
    await promise
    expect(data.value).toBe(42)
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('실패하면 error 에 담고 예외를 던지지 않는다', async () => {
    const { data, loading, error, run } = useAsync(async () => {
      throw new Error('boom')
    })
    await run()
    expect(error.value.message).toBe('boom')
    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
  })
})

describe('useDebouncedRef', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('입력이 멈춘 뒤에만 값이 따라온다', async () => {
    const scope = effectScope()
    const source = ref('')
    const debounced = scope.run(() => useDebouncedRef(source, 300))

    source.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(200)
    source.value = 'ab'
    await nextTick()
    vi.advanceTimersByTime(200)
    expect(debounced.value).toBe('') // 아직 300ms 가 지나지 않았다

    vi.advanceTimersByTime(150)
    expect(debounced.value).toBe('ab')
    scope.stop()
  })
})
