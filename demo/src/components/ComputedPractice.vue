<script setup>
import { ref, computed } from 'vue'

const price = ref(1000)
const quantity = ref(3)

// 계산 횟수를 추적
let computedCallCount = ref(0)
let functionCallCount = ref(0)

// computed 방식: 의존성(price, quantity)이 바뀔 때만 재계산
const totalComputed = computed(() => {
  computedCallCount.value++
  console.log(`[computed] 계산 중... (총 ${computedCallCount.value}회)`)
  return price.value * quantity.value
})

// 함수 방식: 호출할 때마다 계산
function getTotalFunction() {
  functionCallCount.value++
  console.log(`[function] 계산 중... (총 ${functionCallCount.value}회)`)
  return price.value * quantity.value
}

// computed로 추가 계산: 할인가 적용
const discountRate = ref(0.1)
const discountedTotal = computed(() => {
  return totalComputed.value * (1 - discountRate.value)
})

function triggerRerender() {
  // 아무것도 바꾸지 않지만 렌더링은 일어남
  // computed는 캐시된 값을 반환하고, 함수는 매번 계산함
}
</script>

<template>
  <section class="practice">
    <h2>computed 캐싱 vs 함수 성능 비교</h2>

    <div class="controls">
      <label>
        가격: <input v-model.number="price" type="number" />
        <code>{{ price }}</code>
      </label>
      <label>
        수량: <input v-model.number="quantity" type="number" />
        <code>{{ quantity }}</code>
      </label>
      <label>
        할인율: <input v-model.number="discountRate" type="range" min="0" max="1" step="0.1" />
        <code>{{ (discountRate * 100).toFixed(0) }}%</code>
      </label>
    </div>

    <div class="results">
      <article>
        <h3>computed 방식 (권장)</h3>
        <p>가격 × 수량 = <strong>{{ totalComputed }}</strong></p>
        <p>할인된 가격 = <strong>{{ discountedTotal.toFixed(0) }}</strong></p>
        <p style="font-size: 0.85rem; color: #666">
          <strong>계산 횟수: {{ computedCallCount }}</strong>
        </p>
        <p style="font-size: 0.85rem; color: #666">
          입력값을 바꾼 후 버튼을 여러 번 눌러도 계산 횟수가 안 늘어남 → <strong>캐싱 됨!</strong>
        </p>
      </article>

      <article>
        <h3>함수 방식 (비교용)</h3>
        <p>가격 × 수량 = <strong>{{ getTotalFunction() }}</strong></p>
        <p style="font-size: 0.85rem; color: #666">
          <strong>호출 횟수: {{ functionCallCount }}</strong>
        </p>
        <p style="font-size: 0.85rem; color: #666">
          같은 값을 여러 번 호출해도 매번 계산 → <strong>캐싱 없음!</strong>
        </p>
      </article>
    </div>

    <button @click="triggerRerender" style="width: 100%; margin-top: 1rem">
      렌더링 트리거 (입력값 변경 없이 컴포넌트만 갱신)
    </button>

    <p style="margin-top: 1rem; font-size: 0.9rem; color: #666">
      💡 <strong>팁:</strong> 콘솔을 열어서 계산 로그를 보면 차이가 명확합니다.
      computed는 가격/수량이 바뀔 때만 "[computed] 계산 중"이 나타나고,
      함수는 렌더링될 때마다 "[function] 계산 중"이 나타납니다.
    </p>

    <details style="margin-top: 1rem">
      <summary>🔍 왜 computed를 쓸까?</summary>
      <ul style="text-align: left">
        <li>
          <strong>성능:</strong> 의존성이 바뀔 때만 재계산. 렌더링이 자주 일어나는 화면에서 큰 차이.
        </li>
        <li>
          <strong>명확함:</strong> 이 값이 다른 반응형 데이터에 "의존한다"는 의미가 명확.
        </li>
        <li>
          <strong>추적 용이:</strong> Vue DevTools에서 computed 의존성을 추적 가능.
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

.controls {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  display: grid;
  gap: 0.75rem;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls input[type='number'],
.controls input[type='range'] {
  flex: 1;
  max-width: 200px;
}

.controls code {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  font-weight: bold;
}

.results {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  font-size: 1rem;
}

article p {
  margin: 0.5rem 0;
}

@media (max-width: 600px) {
  .results {
    grid-template-columns: 1fr;
  }
}
</style>
