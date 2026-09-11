<script setup>
import { ref, reactive } from 'vue'

// ref 방식
const refUser = ref({ name: '홍길동', age: 20 })

// reactive 방식
const reactiveUser = reactive({ name: '김철수', age: 25 })

// ref로 배열 감싸기
const refFruits = ref(['사과', '바나나'])

// reactive로 배열 만들기
const reactiveFruits = reactive(['포도', '수박'])

function updateRefUser() {
  refUser.value.name = '이영희'
  refUser.value.age++
}

function updateReactiveUser() {
  reactiveUser.name = '박준영'
  reactiveUser.age++
}

function addRefFruit() {
  refFruits.value.push('딸기')
}

function addReactiveFruit() {
  reactiveFruits.push('망고')
}
</script>

<template>
  <section class="practice">
    <h2>ref vs reactive 비교</h2>

    <div class="comparison">
      <article class="ref-example">
        <h3>ref 방식</h3>
        <p>{{ refUser.name }} ({{ refUser.age }}세)</p>
        <button @click="updateRefUser">ref 사용자 업데이트</button>

        <ul>
          <li v-for="fruit in refFruits" :key="fruit">{{ fruit }}</li>
        </ul>
        <button @click="addRefFruit">ref 과일 추가</button>

        <p style="font-size: 0.85rem; color: #666">
          <strong>특징:</strong> 원시값도 감쌀 수 있고, 구조분해 후에도 반응성 유지.
          <code>.value</code>로 접근해야 하지만 템플릿에서는 자동 언랩.
        </p>
      </article>

      <article class="reactive-example">
        <h3>reactive 방식</h3>
        <p>{{ reactiveUser.name }} ({{ reactiveUser.age }}세)</p>
        <button @click="updateReactiveUser">reactive 사용자 업데이트</button>

        <ul>
          <li v-for="fruit in reactiveFruits" :key="fruit">{{ fruit }}</li>
        </ul>
        <button @click="addReactiveFruit">reactive 과일 추가</button>

        <p style="font-size: 0.85rem; color: #666">
          <strong>특징:</strong> 객체/배열 전용, <code>.value</code> 불필요.
          구조분해하면 반응성이 끊기므로 구조분해 사용 금지.
        </p>
      </article>
    </div>

    <details style="margin-top: 1rem">
      <summary>💡 어느 걸 써야 할까?</summary>
      <p>
        <strong>ref를 기본으로 사용 권장:</strong> 구조분해 문제가 없고, 원시값/객체 모두 가능.
        특별히 필요한 게 아니면 ref로 통일하면 코드가 일관적입니다.
      </p>
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

.comparison {
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

article ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

article li {
  padding: 0.25rem 0;
}

article button {
  font-size: 0.85rem;
  padding: 0.4rem 0.8rem;
  margin-top: 0.5rem;
}

@media (max-width: 600px) {
  .comparison {
    grid-template-columns: 1fr;
  }
}
</style>
