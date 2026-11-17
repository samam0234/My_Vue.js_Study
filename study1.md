# study1 — Hello World와 기본 문법

> 🎯 **목표**: 첫 화면(Hello World)을 직접 띄우고, 템플릿 문법(`{{ }}`, `v-bind`, `v-on`, `v-for`, `v-if`/`v-show`, `v-model`)으로 화면과 데이터를 연결한다.

- 이전: [study0](./study0.md) 환경 설정
- 대응 코드: [`demo/src/components/TemplateSyntaxPractice.vue`](./demo/src/components/TemplateSyntaxPractice.vue)

---

## 📖 이론

### 1.1 디렉티브(Directive)

`v-`로 시작하는 특수 속성. "이 요소를 데이터에 이렇게 연결해라"라는 지시입니다.

| 문법 | 줄임 | 역할 |
|---|---|---|
| `{{ 식 }}` | — | 텍스트 보간. 자바스크립트 **식(expression)** 하나만 가능 (`if`문 불가) |
| `v-bind:속성="값"` | `:속성` | 속성에 데이터 연결 (`:class`, `:src`, `:disabled`, `:key`) |
| `v-on:이벤트="핸들러"` | `@이벤트` | 이벤트 연결 (`@click`, `@submit.prevent`) |
| `v-for="x in 배열"` | — | 배열 순회 렌더링. 반드시 `:key` 와 함께 |
| `v-if` / `v-else-if` / `v-else` | — | 조건이 거짓이면 DOM 자체를 **만들지 않음** |
| `v-show` | — | 조건이 거짓이면 `display: none`만 적용 (DOM은 유지) |
| `v-model` | — | 입력 요소와 데이터 양방향 연결 |

### 1.2 `v-if` vs `v-show`

- 자주 토글되는 것 → `v-show` (DOM을 지웠다 만들었다 하지 않으므로 가볍다)
- 거의 안 바뀌거나, 조건이 거짓일 때 아예 필요 없는 것 → `v-if`

### 1.3 `:key`가 필요한 이유

목록이 바뀔 때 Vue가 "어떤 항목이 어떤 DOM과 대응되는지" 구분하는 이름표입니다. **항목의 고유 id**를 쓰고, 배열 인덱스는 항목이 삭제·삽입되는 목록에서는 피합니다.

---

## 🛠️ 실기

### 실습 1. Hello World

`src/App.vue`를 다음처럼 바꿉니다.

```vue
<script setup>
import { ref } from 'vue'

const name = ref('Vue')
</script>

<template>
  <h1>Hello, {{ name }}!</h1>
  <input v-model="name" placeholder="이름을 입력하세요" />
</template>
```

| 줄 | 설명 |
|---|---|
| `ref('Vue')` | 반응형 문자열 데이터 `name` 생성 (ref는 study3에서 자세히) |
| `{{ name }}` | `name`의 값을 화면에 출력. 값이 바뀌면 자동 갱신 |
| `v-model="name"` | 입력창 ↔ `name` 양방향 연결. 입력하는 즉시 `<h1>`이 바뀐다 |

**확인**: 입력창에 글자를 치면 `Hello, ...!`가 실시간으로 바뀌어야 합니다.

### 실습 2. 과일 재고 목록 — 모든 디렉티브 쓰기

파일: [`demo/src/components/TemplateSyntaxPractice.vue`](./demo/src/components/TemplateSyntaxPractice.vue)

```vue
<script setup>
import { ref } from 'vue'

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
</script>

<template>
  <section>
    <button @click="addRandomFruit">랜덤 과일 추가</button>
    <button :class="{ active: showOnlyInStock }" @click="showOnlyInStock = !showOnlyInStock">
      {{ showOnlyInStock ? '전체 보기' : '재고 있는 것만 보기' }}
    </button>

    <p v-if="fruits.length === 0">과일이 없습니다.</p>
    <ul v-else>
      <li v-for="fruit in fruits" :key="fruit.id" v-show="!showOnlyInStock || fruit.inStock">
        <span :class="{ soldout: !fruit.inStock }">{{ fruit.name }}</span>
        <button v-if="fruit.inStock" @click="toggleStock(fruit)">품절 처리</button>
        <button v-else @click="toggleStock(fruit)">재입고</button>
        <button @click="removeFruit(fruit.id)">삭제</button>
      </li>
    </ul>
  </section>
</template>
```

| 코드 | 쓰인 문법 | 동작 |
|---|---|---|
| `@click="addRandomFruit"` | `v-on` | 클릭 시 배열에 새 항목 `push` → `v-for`가 자동으로 한 줄 추가 |
| `:class="{ active: showOnlyInStock }"` | `v-bind` (객체 문법) | `showOnlyInStock`가 참일 때만 `active` 클래스 부여 |
| `{{ showOnlyInStock ? ... : ... }}` | 보간 + 삼항식 | 버튼 글자를 상태에 따라 변경 |
| `<p v-if=... /> <ul v-else>` | `v-if`/`v-else` | 목록이 비면 안내 문구, 있으면 목록 (둘 중 하나만 DOM에 존재) |
| `v-for="fruit in fruits" :key="fruit.id"` | `v-for` + `:key` | 배열 순회, 고유 id로 항목 식별 |
| `v-show="!showOnlyInStock \|\| fruit.inStock"` | `v-show` | 필터가 켜지면 품절 항목을 숨김 (DOM 유지) |
| `fruit.inStock = !fruit.inStock` | 반응형 객체 수정 | 객체 속성만 바꿔도 화면 갱신 |
| `fruits.value = fruits.value.filter(...)` | 배열 교체 | 삭제는 `filter`로 새 배열을 만들어 대입 |

### 실행 확인

```bash
cd demo
npm run dev
```

1. "랜덤 과일 추가" → 목록이 늘어나는가 (`v-for`)
2. "품절 처리" ↔ "재입고" → 문구와 취소선이 바뀌는가 (`v-if`/`v-else`, `:class`)
3. "재고 있는 것만 보기" → 품절 항목이 숨는가 (`v-show`)
4. 개발자도구 Elements 탭에서 `v-show`로 숨긴 `<li>`는 `display: none`으로 **남아 있고**, `v-if`로 사라진 요소는 DOM에 **없는지** 비교

### 직접 해보기 (연습 문제)

1. 과일 이름을 입력해서 추가하는 `<input v-model.trim="newName">` + "추가" 버튼을 만들어 보세요. 빈 문자열은 추가되지 않게 합니다.
2. 재고 있는 과일 수를 `{{ fruits.filter(f => f.inStock).length }}` 로 한 줄 표시해 보세요. (study3에서 `computed`로 개선)

---

## ⚠️ 오류 노트

| 증상 / 경고 | 원인 | 해결 |
|---|---|---|
| `[Vue warn]: Property "xxx" was accessed during render but is not defined` | 템플릿에서 쓴 변수를 `<script setup>`에 선언하지 않음 | 변수/함수를 선언하거나 오타 수정 |
| `v-for` 항목 수정 시 화면이 엉뚱하게 갱신 | `:key` 누락 또는 index를 key로 사용 | 고유 id를 `:key`에 사용 |
| 보간식에 `if`문을 쓰면 컴파일 오류 | `{{ }}`는 **식**만 허용 | 삼항식(`a ? b : c`)이나 `computed`로 분리 |
| `v-if`와 `v-for`를 같은 요소에 사용 | Vue 3에서 `v-if`가 `v-for`보다 먼저 평가되어 반복 변수에 접근 불가 | 바깥에 `<template v-if>` 또는 `computed`로 미리 필터링 |
| 버튼 클릭이 안 됨 | `@click="fn()"` 대신 `fn`을 정의하지 않았거나 오타 | Console 오류 확인 |
| 배열 수정이 화면에 안 보임 | 일반 변수(`let list = []`)를 사용 | `ref`로 감싸고 `.value`로 접근 |

---

## ☐ 체크리스트

- ☑ `App.vue`에 Hello World를 띄우고 `v-model`로 실시간 반영 확인
- ☑ `{{ }}`에는 "식"만 들어간다는 것을 설명할 수 있다
- ☑ `v-bind`(`:`)와 `v-on`(`@`)의 줄임 표기를 읽고 쓸 수 있다
- ☑ `v-for`에는 항상 고유 `:key`를 준다
- ☑ `v-if`와 `v-show`의 차이를 DOM에서 직접 비교했다
- ☐ 연습 문제 1: `v-model.trim` 입력으로 과일 추가 기능 구현
- ☐ 연습 문제 2: 재고 개수 표시

## ➡️ 다음 단계 연결

[study2](./study2.md)에서 화면을 **조각(컴포넌트)** 으로 나누고, 부모→자식 `props`, 자식→부모 `emit`으로 데이터를 주고받습니다. 지금 한 파일에 몰려 있는 과일 목록이 `FruitItem` 같은 컴포넌트로 쪼개질 수 있는지 생각해 보세요.
