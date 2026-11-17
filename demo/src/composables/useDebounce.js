import { ref, watch, onScopeDispose } from 'vue'

// study8: 입력이 멈춘 뒤 delay(ms) 가 지나야 값이 따라오는 ref. 검색 요청 횟수를 줄인다.
export function useDebouncedRef(source, delay = 300) {
  const debounced = ref(source.value)
  let timer

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))
  return debounced
}
