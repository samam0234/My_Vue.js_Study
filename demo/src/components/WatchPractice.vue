<script setup>
import { ref, watch, watchEffect } from 'vue'

// 기본 watch 실습
const searchKeyword = ref('')
const watchLog = ref([])

function addLog(message) {
  const now = new Date().toLocaleTimeString('ko-KR')
  watchLog.value.unshift(`[${now}] ${message}`)
  if (watchLog.value.length > 10) watchLog.value.pop()
}

// searchKeyword 감시: 검색어가 바뀔 때마다 실행
watch(searchKeyword, (newVal, oldVal) => {
  if (oldVal === undefined) return // 초기화 시 스킵
  addLog(`검색어 변경: "${oldVal}" → "${newVal}"`)
})

// 여러 ref 감시
const firstName = ref('')
const lastName = ref('')

watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  if (!oldFirst && !oldLast) return // 초기화 시 스킵
  addLog(`이름 변경: ${oldFirst || '(비움)'} ${oldLast || '(비움)'} → ${newFirst || '(비움)'} ${newLast || '(비움)'}`)
})

// watchEffect 실습: 명시적 감시 대상 없이 자동 추적
const count = ref(0)
const multiplier = ref(1)

watchEffect(() => {
  addLog(`watchEffect 실행: ${count.value} × ${multiplier.value} = ${count.value * multiplier.value}`)
})

function clearLogs() {
  watchLog.value = []
}
</script>

<template>
  <section class="practice">
    <h2>watch & watchEffect 실습</h2>

    <div class="experiments">
      <article class="watch-example">
        <h3>watch 기초: 단일 ref 감시</h3>
        <label>
          검색어: <input v-model="searchKeyword" type="text" placeholder="입력해 보세요" />
        </label>
        <p style="font-size: 0.85rem; color: #666">
          입력하면 아래 로그에 변경 내용이 기록됩니다.
        </p>
      </article>

      <article class="watch-example">
        <h3>watch 심화: 여러 ref 감시</h3>
        <div>
          <label>
            이름: <input v-model="firstName" type="text" placeholder="이름" />
          </label>
          <label>
            성: <input v-model="lastName" type="text" placeholder="성" />
          </label>
        </div>
        <p style="font-size: 0.85rem; color: #666">
          이름이나 성을 바꾸면 두 값이 함께 감시됩니다.
        </p>
      </article>

      <article class="watcheffect-example">
        <h3>watchEffect: 자동 의존성 추적</h3>
        <div>
          <label>
            숫자: <input v-model.number="count" type="number" />
          </label>
          <label>
            곱하기: <input v-model.number="multiplier" type="number" />
          </label>
        </div>
        <p style="font-size: 0.85rem; color: #666">
          watchEffect 콜백 안에서 사용하는 count, multiplier를 자동으로 감시합니다.
        </p>
      </article>
    </div>

    <div class="log-container">
      <h3>🔍 감시 로그 (최근 10개)</h3>
      <div v-if="watchLog.length === 0" class="empty">아직 이벤트가 없습니다.</div>
      <ul v-else>
        <li v-for="(log, idx) in watchLog" :key="idx" class="log-entry">
          {{ log }}
        </li>
      </ul>
      <button @click="clearLogs" style="width: 100%; margin-top: 0.5rem">로그 지우기</button>
    </div>

    <details style="margin-top: 1rem">
      <summary>💡 watch vs watchEffect 차이</summary>
      <table style="width: 100%; text-align: left; margin-top: 0.5rem">
        <thead>
          <tr style="border-bottom: 1px solid #ddd">
            <th>구분</th>
            <th>watch</th>
            <th>watchEffect</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #ddd">
            <td><strong>감시 대상</strong></td>
            <td>명시적으로 지정</td>
            <td>콜백 안에서 사용하는 것 자동 추적</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd">
            <td><strong>구형 값 접근</strong></td>
            <td>가능 (oldValue 파라미터)</td>
            <td>불가</td>
          </tr>
          <tr>
            <td><strong>사용 시기</strong></td>
            <td>비교하며 의존성 명시 필요할 때</td>
            <td>간단한 부수효과만 필요할 때</td>
          </tr>
        </tbody>
      </table>
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

.experiments {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

article {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
}

article h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

article label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

article input {
  flex: 1;
  min-width: 100px;
}

.log-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  max-height: 250px;
  overflow-y: auto;
}

.log-container h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.log-container ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-entry {
  padding: 0.4rem 0;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: #333;
}

.empty {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-style: italic;
}

details {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.75rem;
}

details summary {
  cursor: pointer;
  font-weight: 600;
}

table {
  border-collapse: collapse;
}

table th,
table td {
  padding: 0.5rem;
}

@media (max-width: 600px) {
  .experiments {
    grid-template-columns: 1fr;
  }
}
</style>
