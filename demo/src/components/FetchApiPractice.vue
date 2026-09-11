<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])
const loading = ref(false)
const errorMessage = ref('')

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    // JSONPlaceholder: 테스트용 공개 REST API (실제 데이터베이스 없이 가짜 데이터 제공)
    const res = await fetch('https://jsonplaceholder.typicode.com/users?_limit=5')

    // fetch는 404/500 같은 HTTP 에러를 자동으로 reject하지 않으므로 직접 확인해야 함
    if (!res.ok) {
      throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
    }

    const data = await res.json()
    users.value = data
  } catch (err) {
    // 네트워크 끊김, CORS 문제, 위에서 던진 Error 등을 모두 여기서 잡음
    errorMessage.value = err.message || '데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

// 컴포넌트가 화면에 나타나자마자(onMounted) 데이터를 불러오는 게 흔한 패턴
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <section class="practice">
    <h2>fetch로 API 호출 실습</h2>
    <p class="desc">
      JSONPlaceholder 공개 API에서 사용자 5명을 불러옵니다. 로딩 / 에러 / 성공 세 가지
      상태를 반응형 변수(<code>loading</code>, <code>errorMessage</code>, <code>users</code>)로
      관리합니다.
    </p>

    <button @click="fetchUsers" :disabled="loading">
      {{ loading ? '불러오는 중...' : '다시 불러오기' }}
    </button>

    <!-- 세 가지 상태를 v-if / v-else-if / v-else 로 분기 -->
    <div v-if="loading" class="state loading">⏳ 사용자 목록을 불러오는 중입니다...</div>

    <div v-else-if="errorMessage" class="state error">
      ⚠️ {{ errorMessage }}
      <button @click="fetchUsers">다시 시도</button>
    </div>

    <ul v-else-if="users.length > 0" class="user-list">
      <li v-for="user in users" :key="user.id">
        <strong>{{ user.name }}</strong>
        <span class="email">{{ user.email }}</span>
        <span class="company">{{ user.company?.name }}</span>
      </li>
    </ul>

    <div v-else class="state empty">표시할 사용자가 없습니다.</div>

    <details style="margin-top: 1rem">
      <summary>🔍 상태 관리 흐름</summary>
      <pre class="flow">fetchUsers() 호출
  → loading = true, errorMessage = ''
  → await fetch(...)
      성공 → users에 데이터 저장
      실패 → catch에서 errorMessage에 메시지 저장
  → finally: loading = false (성공하든 실패하든 항상 실행)</pre>
    </details>
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

.state {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
}

.state.loading {
  color: #666;
}

.state.error {
  color: #d9534f;
  background: rgba(217, 83, 79, 0.08);
}

.state.empty {
  color: #999;
  font-style: italic;
}

.user-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.user-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
}

.email {
  color: #888;
}

.company {
  color: #aaa;
}

.flow {
  background: rgba(0, 0, 0, 0.03);
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: pre-wrap;
}
</style>
