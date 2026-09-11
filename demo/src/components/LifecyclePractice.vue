<script setup>
import { ref, onMounted, onUpdated, onUnmounted } from 'vue'

const message = ref('')
const lifecycleLog = ref([])
const renderCount = ref(0)

function addLifecycleLog(stage) {
  const now = new Date().toLocaleTimeString('ko-KR')
  lifecycleLog.value.unshift(`[${now}] ${stage}`)
  if (lifecycleLog.value.length > 15) lifecycleLog.value.pop()
}

// setup 단계 (자동으로 실행됨)
addLifecycleLog('setup() 실행')

// onMounted: 컴포넌트가 DOM에 붙은 직후 (API 로드, 이벤트 리스너 등록 등)
onMounted(() => {
  addLifecycleLog('onMounted: DOM에 붙음')
  // 여기서 보통 API 호출, 타이머 설정 등을 합니다.
  message.value = '(마운트되어 메시지가 생겼습니다)'
})

// onUpdated: 반응형 데이터가 바뀌어서 화면이 갱신될 때마다
onUpdated(() => {
  renderCount.value++
  addLifecycleLog(`onUpdated: 화면 갱신됨 (#${renderCount.value})`)
})

// onUnmounted: 컴포넌트가 언마운트될 때 (정리 작업: 타이머 취소, 이벤트 리스너 제거 등)
onUnmounted(() => {
  addLifecycleLog('onUnmounted: DOM에서 제거됨')
})

function updateMessage() {
  message.value = `업데이트됨: ${new Date().toLocaleTimeString('ko-KR')}`
}

function clearLogs() {
  lifecycleLog.value = []
}
</script>

<template>
  <section class="practice">
    <h2>라이프사이클 훅 (Lifecycle Hooks)</h2>

    <p style="margin: 1rem 0">
      컴포넌트는 생성 → 마운트 → 갱신 → 언마운트 과정을 거갑니다.
      각 단계에 훅을 연결해서 그 시점에 코드를 실행할 수 있습니다.
    </p>

    <div class="timeline">
      <div class="stage">
        <h4>📋 setup()</h4>
        <p class="description">컴포넌트 인스턴스가 생성될 때. 반응형 데이터 선언 등.</p>
      </div>

      <div class="arrow">↓</div>

      <div class="stage highlight">
        <h4>📌 onMounted()</h4>
        <p class="description">
          컴포넌트가 DOM에 붙은 직후. <strong>API 데이터 로드</strong>, 이벤트 리스너 등록 등을 여기서 합니다.
        </p>
      </div>

      <div class="arrow">↓ (반응형 데이터 변경)</div>

      <div class="stage">
        <h4>🔄 onUpdated()</h4>
        <p class="description">
          반응형 데이터가 바뀌어서 화면이 갱신될 때마다 실행.
          (과도하게 실행될 수 있으므로 주의)
        </p>
      </div>

      <div class="arrow">↓</div>

      <div class="stage">
        <h4>❌ onUnmounted()</h4>
        <p class="description">컴포넌트가 DOM에서 제거될 때. 정리 작업: 타이머 취소, 리스너 제거 등.</p>
      </div>
    </div>

    <div class="interactive">
      <h3>📝 상호작용 예제</h3>
      <p>{{ message || '아직 메시지가 없습니다 (onMounted에서 설정됨)' }}</p>
      <button @click="updateMessage">메시지 업데이트 (onUpdated 트리거)</button>
      <p style="font-size: 0.85rem; color: #666">
        버튼을 누르면 onUpdated가 실행되고, 로그에 기록됩니다.
      </p>
    </div>

    <div class="log-container">
      <h3>🔍 라이프사이클 로그 (최근 15개)</h3>
      <ul v-if="lifecycleLog.length > 0">
        <li v-for="(log, idx) in lifecycleLog" :key="idx" class="log-entry">
          {{ log }}
        </li>
      </ul>
      <div v-else class="empty">아직 기록이 없습니다.</div>
      <button @click="clearLogs" style="width: 100%; margin-top: 0.5rem">로그 지우기</button>
    </div>

    <details style="margin-top: 1rem">
      <summary>🔗 실무 사용 사례</summary>
      <ul style="text-align: left">
        <li>
          <strong>onMounted:</strong> API로 데이터 로드, 외부 라이브러리 초기화, 이벤트 리스너 등록
        </li>
        <li>
          <strong>onUpdated:</strong> 화면 갱신 후 특정 DOM 요소에 포커스 주기 (드물게 사용)
        </li>
        <li>
          <strong>onUnmounted:</strong> 타이머 취소, 이벤트 리스너 제거, 구독(subscription) 해지
        </li>
      </ul>
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

.timeline {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
}

.stage {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.stage.highlight {
  background: #fff9e6;
  border-color: #f0ad4e;
}

.stage h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
}

.description {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  text-align: left;
}

.arrow {
  color: #999;
  font-size: 1.2rem;
  margin: 0.5rem 0;
}

.interactive {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  margin: 1rem 0;
}

.interactive h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.interactive p {
  margin: 0.5rem 0;
}

.log-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  max-height: 200px;
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
  padding: 0.3rem 0;
  font-size: 0.8rem;
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
</style>
