import { ref, type Ref } from 'vue'

export interface UseAsyncReturn<T, A extends unknown[]> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  run: (...args: A) => Promise<T | undefined>
}

/** loading / error / data 3종 세트를 공통화한다 (study8). */
export function useAsync<T, A extends unknown[] = []>(
  fn: (...args: A) => Promise<T>,
): UseAsyncReturn<T, A> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function run(...args: A) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, run }
}
