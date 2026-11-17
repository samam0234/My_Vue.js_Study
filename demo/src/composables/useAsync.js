import { ref } from 'vue'

// study8: loading / error / data 3종 세트를 화면마다 반복하지 않도록 공통화한다.
export function useAsync(fn) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, run }
}
