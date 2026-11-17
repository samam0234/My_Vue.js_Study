import { ref, watch, onScopeDispose, type Ref } from 'vue'

/** 입력이 멈춘 뒤 delay(ms) 가 지나야 값이 따라오는 ref (study8). */
export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))
  return debounced
}
