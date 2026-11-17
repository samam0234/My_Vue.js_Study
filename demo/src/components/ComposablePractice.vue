<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAsync } from '../composables/useAsync.js'
import { useDebouncedRef } from '../composables/useDebounce.js'
import { env } from '../config/env.js'
import StatusBadge from './StatusBadge.vue'

// study8: composable(useAsync, useDebouncedRef) + 환경변수(env) + study2 의 StatusBadge 슬롯을 함께 쓴다.
const keyword = ref('')
const debounced = useDebouncedRef(keyword, 300)
const requestCount = ref(0)

const {
  data: users,
  loading,
  error,
  run: load,
} = useAsync(async (q) => {
  requestCount.value += 1
  const res = await fetch('https://jsonplaceholder.typicode.com/users')
  if (!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
  const all = await res.json()
  return all.filter((u) => u.name.toLowerCase().includes((q ?? '').toLowerCase()))
})

onMounted(() => load(''))
watch(debounced, (q) => load(q)) // 타이핑이 300ms 멈췄을 때만 요청한다
</script>

<template>
  <section class="practice">
    <h2>composable 실습 (study8)</h2>
    <p class="desc">
      <code>useAsync</code>로 loading/error/data를 공통화하고, <code>useDebouncedRef</code>로
      입력이 멈춘 뒤에만 요청합니다. 앱 제목(환경변수): <strong>{{ env.appTitle }}</strong>
    </p>

    <input v-model="keyword" placeholder="이름 검색 (예: leanne)" />
    <p>
      요청 횟수: <strong>{{ requestCount }}</strong>
      <StatusBadge v-if="loading" type="warn">불러오는 중</StatusBadge>
      <StatusBadge v-else-if="error" type="danger">오류</StatusBadge>
      <StatusBadge v-else>완료</StatusBadge>
    </p>

    <p v-if="error" class="error">⚠️ {{ error.message }}</p>
    <ul v-else-if="users">
      <li v-for="u in users" :key="u.id">{{ u.name }} ({{ u.email }})</li>
    </ul>
  </section>
</template>

<style scoped>
.practice {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.desc {
  font-size: 0.9rem;
  color: #666;
}
.error {
  color: #d9534f;
}
</style>
