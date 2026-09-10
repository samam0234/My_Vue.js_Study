# study1 — Vue 3 + Vite 프로젝트 생성 & 템플릿 문법 실습

[study0.md](./study0.md)에서 이론을 훑었으니, 이번엔 실제로 프로젝트를 만들고 화면에 뭔가 그려봅니다.

```
- [x] Vue 3 + Vite 프로젝트 생성
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if   (실습 컴포넌트로 확인)
- [ ] ref, reactive, computed, watch              (다음 문서 예정)
- [ ] 컴포넌트 props / emit
- [ ] Vue Router (목록 → 상세)
- [ ] 폼 검증 + fetch로 API 호출
- [ ] Pinia로 로그인 상태 공유 (선택)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 프로젝트 생성 과정

study0 1.1절에서 설명한 대로 공식 스캐폴딩 CLI를 사용했습니다.

```bash
npm create vue@latest demo -- --router --pinia
```

- `demo`: 프로젝트 폴더 이름
- `--router`: Vue Router 자동 설치 + 기본 라우트(`/`, `/about`) 설정까지 생성 (study0 5장에서 다룰 내용을 미리 세팅)
- `--pinia`: Pinia 자동 설치 + `createPinia()` 연결까지 생성 (study0 7장 대비)
- TypeScript, ESLint, 테스트 도구는 아직 필요 없어서 켜지 않았습니다 (기초 문법에 집중하기 위함)

```bash
cd demo
npm install
npm run dev
```

`npm run dev` 실행 후 터미널에 뜨는 주소(기본 `http://localhost:5173`)로 접속하면 기본 Vue 환영 페이지가 보입니다.

## 2. 실제로 생성된 폴더 구조

```
demo/
├─ index.html
├─ vite.config.js
├─ package.json
├─ src/
│  ├─ main.js              # 앱 생성 + router/pinia 연결
│  ├─ App.vue               # 헤더 + <RouterView>
│  ├─ router/
│  │  └─ index.js           # '/' → HomeView, '/about' → AboutView
│  ├─ stores/
│  │  └─ counter.js          # Pinia 스토어 예시 (study7에서 본격 활용 예정)
│  ├─ views/
│  │  ├─ HomeView.vue
│  │  └─ AboutView.vue
│  └─ components/
│     ├─ HelloWorld.vue
│     ├─ TheWelcome.vue ...   # 기본 환영 화면 컴포넌트들
│     └─ TemplateSyntaxPractice.vue   # 이번 실습에서 새로 추가한 컴포넌트
```

study0 1.2절에서 설명한 구조 그대로 생성된 것을 확인했습니다. `router/`, `stores/` 폴더는 CLI 옵션(`--router`, `--pinia`)을 켰기 때문에 자동으로 생겼습니다.

### `src/main.js` (자동 생성됨)

```js
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

study0 1.4절에서 본 `createApp(App).mount('#app')`에 `app.use(...)`가 추가된 형태입니다. `use()`는 플러그인(Router, Pinia)을 앱에 등록하는 함수라고 study0 5.2절에서 설명했던 부분과 연결됩니다.

## 3. 템플릿 문법 실습 — `TemplateSyntaxPractice.vue`

study0 2장에서 배운 `v-bind`, `v-on`, `v-for`, `v-if`/`v-else`/`v-show`를 직접 써보기 위해 "과일 재고 목록" 컴포넌트를 만들어 `HomeView.vue`에 붙였습니다.

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

function toggleFilter() {
  showOnlyInStock.value = !showOnlyInStock.value
}
</script>

<template>
  <section class="practice">
    <h2>템플릿 문법 실습: 과일 재고 목록</h2>

    <button @click="addRandomFruit">랜덤 과일 추가</button>

    <button :class="{ active: showOnlyInStock }" @click="toggleFilter">
      {{ showOnlyInStock ? '전체 보기' : '재고 있는 것만 보기' }}
    </button>

    <p v-if="fruits.length === 0">과일이 없습니다. 버튼을 눌러 추가해보세요.</p>

    <ul v-else>
      <li
        v-for="fruit in fruits"
        :key="fruit.id"
        v-show="!showOnlyInStock || fruit.inStock"
      >
        <span :class="{ soldout: !fruit.inStock }">{{ fruit.name }}</span>

        <button v-if="fruit.inStock" @click="toggleStock(fruit)">품절 처리</button>
        <button v-else @click="toggleStock(fruit)">재입고</button>

        <button @click="removeFruit(fruit.id)">삭제</button>
      </li>
    </ul>
  </section>
</template>
```

### 어떤 디렉티브를 어디서 썼는지 (study0 2장과 매칭)

| 디렉티브 | 이 컴포넌트에서 쓰인 곳 | 하는 일 |
|---|---|---|
| `v-on` (`@click`) | `addRandomFruit`, `toggleFilter`, `toggleStock`, `removeFruit` 버튼 | 클릭 시 함수 실행 |
| `v-bind` (`:class`, `:key`) | 필터 버튼의 `active` 클래스, 품절 상품의 `soldout` 클래스, `v-for`의 `:key` | 데이터 값을 속성에 연결 |
| `v-for` | `<li v-for="fruit in fruits" :key="fruit.id">` | 배열을 순회하며 DOM 반복 생성 |
| `v-if` / `v-else` | 목록이 비었을 때 안내 문구 ↔ 목록 표시, 재고 유무에 따른 버튼 문구 | 조건에 따라 DOM 자체를 만들거나 안 만듦 |
| `v-show` | 각 `<li>`에서 필터가 켜졌을 때 품절 상품 숨김 | 조건에 따라 `display`만 토글 (DOM은 유지) |

`v-if`(목록 유무)와 `v-show`(필터링)를 한 컴포넌트 안에 같이 써서 study0 2.6절에서 설명한 차이 — "아예 안 만듦 vs 숨기기만 함" — 를 실습으로 대조해봤습니다.

> 참고: `fruits`, `showOnlyInStock`에 쓴 `ref`는 study0 3.1절에서 이론만 짚고 넘어간 것을 미리 가져다 쓴 것입니다. `ref`/`reactive`/`computed`/`watch`는 다음 문서(study2)에서 본격적으로 다룹니다.

## 4. 실행 확인

```bash
cd demo
npm run dev
```

- `http://localhost:5173` 접속 → 상단에 "템플릿 문법 실습: 과일 재고 목록" 섹션이 보이는지 확인
- "랜덤 과일 추가" 클릭 → 목록에 새 항목이 늘어나는지 (`v-for` 반응 확인)
- "품절 처리" / "재입고" 클릭 → 문구와 취소선 스타일이 바뀌는지 (`v-if`/`v-else`, `:class` 확인)
- "재고 있는 것만 보기" 클릭 → 품절 항목이 숨겨지는지 (`v-show` 확인)
- "삭제" 클릭 → 항목이 목록에서 완전히 제거되는지 (`v-for` + 배열 갱신 확인)

개발 서버 로그와 `curl`로 홈 페이지(200 응답) 및 컴포넌트 파일이 정상적으로 서빙되는 것까지 확인했습니다. 에러 없이 콘솔이 깨끗한 상태입니다.

## 5. 다음 단계 (study2 예정)

- `ref` vs `reactive` 차이를 별도 실습 컴포넌트로 비교
- `computed`로 "재고 있는 과일 개수" 같은 파생값 만들기
- `watch`로 필터 상태 변화를 감시해서 콘솔에 로그 남기기
