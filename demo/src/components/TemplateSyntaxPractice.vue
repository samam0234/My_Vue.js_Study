<script setup>
import { ref } from 'vue'

// study0 3.1절에서 다룬 ref — 여기서는 "값 하나 담는 반응형 상자" 정도로만 쓰고,
// ref/reactive/computed/watch는 다음 study 문서에서 깊게 다룹니다.
const fruitPool = ['사과', '바나나', '포도', '수박', '딸기', '망고']
let nextId = 4

const fruits = ref([
  { id: 1, name: '사과', inStock: true },
  { id: 2, name: '바나나', inStock: false },
  { id: 3, name: '포도', inStock: true },
])

const showOnlyInStock = ref(false)

function addRandomFruit() {
  const name = fruitPool[Math.floor(Math.random() * fruitPool.length)]
  fruits.value.push({ id: nextId++, name, inStock: true })
}

function toggleStock(fruit) {
  fruit.inStock = !fruit.inStock
}

function removeFruit(id) {
  fruits.value = fruits.value.filter((f) => f.id !== id)
}

function toggleFilter() {
  showOnlyInStock.value = !showOnlyInStock.value
}
</script>

<template>
  <section class="practice">
    <h2>템플릿 문법 실습: 과일 재고 목록</h2>

    <!-- v-on: 클릭 이벤트에 함수 연결 -->
    <button @click="addRandomFruit">랜덤 과일 추가</button>

    <!-- v-bind(:class)로 현재 필터 상태를 버튼 스타일에 반영, v-on으로 토글 -->
    <button :class="{ active: showOnlyInStock }" @click="toggleFilter">
      {{ showOnlyInStock ? '전체 보기' : '재고 있는 것만 보기' }}
    </button>

    <p v-if="fruits.length === 0">과일이 없습니다. 버튼을 눌러 추가해보세요.</p>

    <ul v-else>
      <!-- v-for: 배열을 순회하며 li 생성, :key로 각 항목 식별 -->
      <li
        v-for="fruit in fruits"
        :key="fruit.id"
        v-show="!showOnlyInStock || fruit.inStock"
      >
        <!-- v-bind(:class)로 재고 여부에 따라 클래스 다르게 적용 -->
        <span :class="{ soldout: !fruit.inStock }">{{ fruit.name }}</span>

        <!-- v-if / v-else: 재고 여부에 따라 다른 버튼 문구 -->
        <button v-if="fruit.inStock" @click="toggleStock(fruit)">품절 처리</button>
        <button v-else @click="toggleStock(fruit)">재입고</button>

        <button @click="removeFruit(fruit.id)">삭제</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.practice {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.practice ul {
  list-style: none;
  padding: 0;
}

.practice li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.soldout {
  text-decoration: line-through;
  color: var(--color-text-light-2, #888);
}

.practice button.active {
  background-color: var(--color-border);
}
</style>
