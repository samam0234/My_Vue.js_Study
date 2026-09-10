# study0 — Vue 3 시작 전 기초 이론

이 문서는 실습(코드 작성) 이전에, 앞으로 나올 용어와 개념을 미리 이해하기 위한 문서입니다.
체크리스트 순서대로 정리했고, 각 섹션 끝에는 "실습에서 확인할 것"을 적어뒀습니다.

```
- [ ] Vue 3 + Vite 프로젝트 생성
- [ ] 템플릿 문법, v-bind / v-on / v-for / v-if
- [ ] ref, reactive, computed, watch
- [ ] 컴포넌트 props / emit
- [ ] Vue Router (목록 → 상세)
- [ ] 폼 검증 + fetch로 API 호출
- [ ] Pinia로 로그인 상태 공유 (선택)
```

---

## 0. 아주 기초 개념 먼저

### 0.1 SPA (Single Page Application)란?

일반적인 웹사이트는 페이지 이동마다 서버에 새 HTML을 요청합니다 (MPA, Multi Page Application).
반면 SPA는 **처음 한 번만 HTML을 받고**, 이후에는 자바스크립트가 화면 내용을 직접 바꿔치기합니다.
Vue, React, Angular는 모두 SPA를 만들기 위한 도구입니다.

- 장점: 페이지 전환이 빠르고 부드러움 (새로고침 없음), 앱처럼 느껴짐
- 단점: 초기 로딩이 상대적으로 무거움, 검색엔진최적화(SEO)가 까다로움 (별도 대응 필요)

### 0.2 프레임워크(Framework) vs 라이브러리(Library)

- **라이브러리**: 내가 필요할 때 호출해서 쓰는 도구 (예: 날짜 포맷 함수)
- **프레임워크**: 전체 구조와 흐름을 프레임워크가 정하고, 내가 그 안에 코드를 채워 넣음

Vue는 프레임워크에 가깝습니다. "화면(View)을 데이터(State)에 따라 자동으로 갱신"하는 규칙을 Vue가 정해두고, 우리는 데이터와 템플릿만 작성합니다.

### 0.3 반응형(Reactivity)이란?

Vue를 관통하는 핵심 개념입니다.

> 데이터가 바뀌면, 그 데이터를 사용하는 화면이 **자동으로** 다시 그려진다.

바닐라 JS라면 `count++` 후에 `document.querySelector(...).textContent = count` 처럼 직접 DOM을 갱신해야 하지만, Vue에서는 `count`라는 반응형 데이터를 바꾸기만 하면 화면이 알아서 갱신됩니다. 이걸 가능하게 하는 게 `ref`/`reactive`입니다 (2장에서 다룸).

### 0.4 Node.js / npm이 뭔가

- **Node.js**: 브라우저 밖에서 자바스크립트를 실행할 수 있게 해주는 실행 환경. Vite 같은 개발 도구, 빌드 스크립트가 이걸로 돌아갑니다.
- **npm (Node Package Manager)**: 자바스크립트 패키지(라이브러리)를 설치/관리하는 도구. Node.js 설치 시 같이 설치됩니다.
- **package.json**: 프로젝트가 어떤 패키지에 의존하는지, 어떤 명령어(`npm run dev` 등)를 쓸 수 있는지 적어놓은 설정 파일.
- **node_modules**: 설치된 패키지들이 실제로 저장되는 폴더 (용량이 크고, git에 올리지 않음 → `.gitignore`).

**실습 전 확인할 것**: 터미널에 `node -v`, `npm -v`를 입력해 버전이 나오는지 확인 (Node 18 이상 권장).

### 0.5 번들러(Bundler)와 Vite

브라우저는 원래 `import`/`export` 같은 모듈 문법이나 `.vue` 파일을 직접 이해하지 못합니다. **번들러**가 여러 파일을 브라우저가 이해할 수 있는 형태로 묶고 변환해줍니다.

- 예전 Vue 프로젝트는 **Webpack** 기반 `vue-cli`를 썼음
- 지금은 **Vite**(비트, 프랑스어로 "빠르다")가 사실상 표준

Vite가 빠른 이유(대략): 개발 중에는 파일을 통째로 번들링하지 않고, 브라우저의 네이티브 ES 모듈 기능을 이용해 필요한 파일만 즉시 변환해서 내려줌. 그래서 서버 시작이 매우 빠름.

---

## 1. Vue 3 + Vite 프로젝트 생성

### 1.1 생성 명령어

```bash
npm create vue@latest
```

실행하면 대화형으로 다음을 물어봅니다 (전부 이 체크리스트와 관련된 선택지들입니다):

- 프로젝트 이름
- TypeScript 사용 여부
- Vue Router 추가 여부 → **예 (4번 항목에서 다룸)**
- Pinia 추가 여부 → **예 (7번 항목에서 다룸, 선택이지만 미리 넣어두는 걸 권장)**
- ESLint / Prettier 등

생성 후:

```bash
cd <프로젝트폴더>
npm install   # package.json에 적힌 패키지들을 node_modules에 설치
npm run dev   # 개발 서버 실행 (보통 http://localhost:5173)
```

### 1.2 생성된 폴더 구조 (핵심만)

```
프로젝트/
├─ index.html          # 진짜 진입점(entry). <div id="app"></div> 하나만 있음
├─ vite.config.js       # Vite 설정 파일
├─ package.json         # 의존성 및 명령어 정의
├─ src/
│  ├─ main.js           # JS 진입점. Vue 앱을 생성해서 #app에 "마운트"
│  ├─ App.vue           # 최상위(루트) 컴포넌트
│  ├─ components/       # 재사용 컴포넌트들
│  ├─ router/           # Vue Router 설정 (router 선택 시)
│  ├─ stores/           # Pinia 스토어 (Pinia 선택 시)
│  └─ assets/           # 이미지, css 등
```

`index.html`은 거의 텅 비어 있고, 실제 화면은 전부 JS가 그려 넣습니다 — 이게 SPA의 특징입니다.

### 1.3 SFC (Single File Component) — `.vue` 파일

Vue의 가장 독특한 특징: `.vue` 파일 하나에 **구조(template) + 로직(script) + 스타일(style)** 을 같이 씁니다.

```vue
<template>
  <!-- 여기 HTML 비슷한 템플릿 -->
</template>

<script setup>
  // 여기 JS 로직 (데이터, 함수 등)
</script>

<style scoped>
  /* 여기 CSS. scoped면 이 컴포넌트에만 적용됨 */
</style>
```

- `<script setup>`: Vue 3에서 권장하는 최신 문법(Composition API). 선언한 변수/함수가 자동으로 템플릿에서 사용 가능해집니다. (예전 방식인 `export default { data() {...} }` 형태는 Options API라고 부르는데, 요즘은 잘 안 씀)
- `scoped`: 이 style 블록의 CSS가 다른 컴포넌트에 새어나가지 않도록 격리.

### 1.4 main.js가 하는 일

```js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

풀이: "App이라는 루트 컴포넌트로 Vue 앱 인스턴스를 만들고, index.html의 `#app` 요소 자리에 그려 넣어라."

**실습에서 확인할 것**: `npm run dev` 실행 → 브라우저에서 기본 페이지가 뜨는지, 콘솔 에러가 없는지.

---

## 2. 템플릿 문법 / 디렉티브

### 2.1 디렉티브(Directive)란?

`v-`로 시작하는 특수 속성. "이 DOM 요소를 데이터에 따라 이렇게 다뤄라"는 지시문입니다.

### 2.2 텍스트 보간 (Mustache 문법)

```html
<p>{{ message }}</p>
```

`{{ }}` 안에는 JS 표현식을 씁니다 (`message`, `count + 1`, `user.name` 등 가능. 단, `if`문 같은 구문은 불가).

### 2.3 `v-bind` — 속성 바인딩

HTML 속성(attribute)에 JS 값을 연결. `:` 로 축약 가능.

```html
<img v-bind:src="imageUrl">
<img :src="imageUrl">        <!-- 축약형, 실무에서 거의 이걸 씀 -->
<button :disabled="isLoading">저장</button>
```

### 2.4 `v-on` — 이벤트 바인딩

DOM 이벤트에 함수를 연결. `@` 로 축약 가능.

```html
<button v-on:click="increment">+1</button>
<button @click="increment">+1</button>   <!-- 축약형 -->
<input @keyup.enter="submit">             <!-- .enter 같은 수식어(modifier) -->
```

### 2.5 `v-for` — 리스트 렌더링

```html
<li v-for="item in items" :key="item.id">
  {{ item.name }}
</li>
```

- `:key`는 **필수처럼 취급**해야 함. Vue가 리스트 변경 시 어떤 항목이 어떤 DOM과 대응하는지 추적하는 식별자. key가 없거나 index를 key로 쓰면 리스트 순서 변경/삭제 시 버그(엉뚱한 항목이 갱신됨) 가능성이 커짐.

### 2.6 `v-if` / `v-else-if` / `v-else` vs `v-show`

```html
<p v-if="isLoggedIn">환영합니다</p>
<p v-else>로그인이 필요합니다</p>

<p v-show="isVisible">토글되는 문구</p>
```

- `v-if`: 조건이 false면 **DOM 자체를 만들지 않음** (완전히 제거/재생성). 전환이 잦지 않은 경우에 적합.
- `v-show`: 항상 DOM은 존재하고 `display: none`으로만 숨김. 자주 토글되는 경우에 적합 (렌더 비용이 v-if보다 쌈).

### 2.7 `v-model` (2장에서 잠깐 언급, 6번 폼 항목에서 본격 사용)

폼 입력과 데이터를 **양방향**으로 묶어주는 디렉티브. `:value` + `@input`을 합쳐놓은 축약형이라고 생각하면 됩니다.

```html
<input v-model="username">
```

**실습에서 확인할 것**: 배열을 `v-for`로 뿌리고, 버튼 클릭(`v-on`)으로 배열을 추가/삭제했을 때 화면이 자동 갱신되는지, `v-if`로 조건부 문구가 잘 바뀌는지.

---

## 3. 반응형 상태: `ref`, `reactive`, `computed`, `watch`

이 섹션은 Composition API의 핵심입니다. `<script setup>` 안에서 사용합니다.

### 3.1 `ref` — 단일 값을 반응형으로 만들기

```js
import { ref } from 'vue'

const count = ref(0)
console.log(count.value)  // JS 코드 안에서는 .value로 접근해야 함
count.value++
```

- 숫자, 문자열, 불리언 같은 **원시값(primitive)** 뿐 아니라 객체/배열도 감쌀 수 있지만, 보통 단일 값에 많이 씀.
- **왜 `.value`가 필요한가**: JS의 원시값은 참조로 추적할 방법이 없어서, Vue가 `{ value: 0 }` 같은 객체로 감싸고 그 객체의 getter/setter를 통해 변화를 감지합니다.
- **템플릿 안에서는 `.value`를 안 씀** — Vue가 템플릿에서는 자동으로 언랩(unwrap)해줍니다.

```html
<template>
  <p>{{ count }}</p>  <!-- .value 안 씀 -->
</template>
```

### 3.2 `reactive` — 객체를 통째로 반응형으로 만들기

```js
import { reactive } from 'vue'

const user = reactive({ name: '홍길동', age: 20 })
user.age++   // .value 없이 바로 접근/수정
```

- 객체/배열 전용. `.value`가 필요 없음.
- **주의**: `reactive`로 만든 객체를 구조분해(`const { age } = user`)하면 반응성이 끊깁니다. 이 때문에 실무에서는 **ref를 기본으로 쓰고, 여러 필드를 묶고 싶을 때만 reactive**를 쓰는 경우가 많습니다.

### 3.3 `ref` vs `reactive` 선택 기준 (요약)

| 상황 | 추천 |
|---|---|
| 숫자, 문자열, 불리언 하나 | `ref` |
| 배열 | `ref` (관례상 무난) |
| 여러 필드를 가진 객체를 하나의 단위로 다룸 | `reactive` 또는 `ref` 둘 다 가능, 취향 |
| 구조분해해서 개별 변수로 쓰고 싶음 | `ref` (또는 `toRefs`) |

### 3.4 `computed` — 계산된 속성

다른 반응형 데이터로부터 **파생되는 값**을 정의. 의존하는 값이 바뀔 때만 재계산되고, 안 바뀌면 이전 결과를 캐싱해서 재사용합니다 (일반 함수 호출과의 차이점).

```js
import { ref, computed } from 'vue'

const price = ref(1000)
const quantity = ref(3)
const total = computed(() => price.value * quantity.value)
```

- `total`은 `price`나 `quantity`가 바뀔 때만 다시 계산됨. 매 렌더링마다 재계산하는 함수(`function getTotal() {...}`)보다 효율적.
- 기본적으로 읽기 전용(get만 정의). 쓰기도 가능하게 하려면 `{ get, set }` 형태로 정의(고급).

### 3.5 `watch` — 값 변화를 감시해서 부수효과 실행

```js
import { ref, watch } from 'vue'

const keyword = ref('')

watch(keyword, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}로 변경됨`)
  // 예: 여기서 검색 API 호출
})
```

- `computed`는 "값을 만들어내는 것", `watch`는 "값이 바뀌었을 때 무언가(API 호출, 콘솔 로그, localStorage 저장 등 부수효과)를 실행하는 것" — 목적이 다릅니다.
- `watchEffect`: 감시 대상을 명시하지 않고, 콜백 안에서 **사용한 반응형 값들을 자동으로 추적**해서 감시하는 변형. 간단한 경우에 편리.

### 3.6 (미리 알아두면 좋은) 라이프사이클 훅

컴포넌트가 "화면에 나타남 / 갱신됨 / 사라짐" 시점에 실행할 코드를 등록하는 함수들. 6번 항목(API 호출)에서 바로 쓰게 됩니다.

```js
import { onMounted } from 'vue'

onMounted(() => {
  // 컴포넌트가 DOM에 붙은 직후 실행 → API 호출하기 좋은 시점
})
```

**실습에서 확인할 것**: `ref`로 카운터 만들고 콘솔에서 `.value`로 접근해보기, `computed`가 캐싱되는지(콘솔 로그로 재계산 횟수 확인), `watch`로 입력값 변화 감지해보기.

---

## 4. 컴포넌트 — `props` / `emit`

### 4.1 컴포넌트란?

재사용 가능한 UI 조각. 버튼, 카드, 목록 아이템 등을 컴포넌트로 쪼개서 조립합니다. 큰 앱은 결국 "컴포넌트 트리"입니다 (App.vue가 최상위, 그 아래 여러 자식 컴포넌트).

### 4.2 단방향 데이터 흐름 (One-way data flow)

Vue(및 대부분의 프레임워크)의 원칙: **데이터는 부모 → 자식으로만 내려간다.** 자식이 부모 데이터를 직접 바꾸는 건 금지. 자식이 부모에게 "이런 일이 있었어요"라고 **알리기만** 하고, 실제 변경은 부모가 합니다.

이 원칙 덕분에 데이터가 어디서 바뀌는지 추적하기 쉬워집니다 (양방향으로 아무데서나 바꾸면 디버깅이 지옥이 됨).

### 4.3 `props` — 부모가 자식에게 데이터 전달

```vue
<!-- 부모: App.vue -->
<template>
  <ItemCard :title="product.name" :price="product.price" />
</template>
```

```vue
<!-- 자식: ItemCard.vue -->
<script setup>
defineProps({
  title: String,
  price: Number
})
</script>

<template>
  <div>{{ title }} - {{ price }}원</div>
</template>
```

- `defineProps`: `<script setup>` 전용 매크로(컴파일러가 특별 처리해주는 함수라 import 없이 바로 사용). 이 컴포넌트가 어떤 props를 받을지, 타입은 무엇인지 선언.
- **자식 안에서 props를 직접 수정하면 안 됨** (경고 발생). 수정이 필요하면 emit으로 부모에게 요청.

### 4.4 `emit` — 자식이 부모에게 이벤트 알리기

```vue
<!-- 자식: LikeButton.vue -->
<script setup>
const emit = defineEmits(['like'])

function handleClick() {
  emit('like', { id: 1 })  // 'like'라는 이름의 커스텀 이벤트 발생, 데이터 첨부 가능
}
</script>

<template>
  <button @click="handleClick">좋아요</button>
</template>
```

```vue
<!-- 부모 -->
<template>
  <LikeButton @like="onLike" />
</template>

<script setup>
function onLike(payload) {
  console.log('좋아요 눌림:', payload)
}
</script>
```

- `defineEmits`: 이 컴포넌트가 어떤 커스텀 이벤트를 발생시킬 수 있는지 선언.
- 네이티브 이벤트(`@click`)와 커스텀 이벤트(`@like`) 문법이 똑같아 보이지만, 후자는 우리가 `emit()`으로 직접 발생시키는 것.

**한 줄 요약**: props는 내려가고(down), emit은 올라간다(up).

**실습에서 확인할 것**: 부모가 목록 데이터를 갖고, 자식(카드 컴포넌트)에게 props로 각 항목을 내려주고, 자식에서 클릭 시 emit으로 "선택됨"을 부모에 알리기.

---

## 5. Vue Router (목록 → 상세)

### 5.1 왜 필요한가

SPA는 페이지 전체를 새로고침하지 않으므로, `/products`, `/products/3` 같은 "페이지처럼 보이는 화면 전환"을 자바스크립트가 흉내 내야 합니다. 그 역할을 하는 라이브러리가 **Vue Router**입니다. (주소창 URL을 바꾸면서도 실제로는 새로고침 없이 컴포넌트만 교체)

### 5.2 설치 및 기본 설정

```bash
npm install vue-router
```

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'

const routes = [
  { path: '/', component: ProductList },
  { path: '/products/:id', component: ProductDetail },  // :id → 동적 파라미터
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

```js
// main.js
import router from './router'
createApp(App).use(router).mount('#app')
```

- `createWebHistory()`: 실제 브라우저 주소(`/products/3`)를 쓰는 방식 (vs 해시 방식 `#/products/3`인 `createWebHashHistory`).
- `use(router)`: Vue의 "플러그인" 설치 방식. Pinia도 이 패턴을 씁니다.

### 5.3 `<router-view>` / `<router-link>`

```vue
<!-- App.vue -->
<template>
  <router-link to="/">목록으로</router-link>
  <router-view />  <!-- 현재 경로에 맞는 컴포넌트가 여기 그려짐 -->
</template>
```

- `<router-link>`: `<a>` 태그를 대체. 클릭해도 새로고침 없이 라우팅만 바뀜.
- `<router-view>`: 현재 라우트에 매칭된 컴포넌트가 렌더링되는 자리(placeholder).

### 5.4 동적 파라미터로 상세 페이지 만들기

```vue
<!-- views/ProductDetail.vue -->
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id)   // URL의 :id 부분
</script>
```

- `useRoute()`: 현재 라우트 정보(파라미터, 쿼리스트링 등)를 읽는 함수.
- `useRouter()`: 코드로 페이지 이동시키고 싶을 때 (`router.push('/products/3')`).

**실습에서 확인할 것**: 목록 페이지에서 항목 클릭 → 상세 페이지로 이동 → URL의 id로 해당 데이터만 보여주기, 뒤로가기 버튼이 브라우저 히스토리와 잘 연동되는지.

---

## 6. 폼 검증 + `fetch`로 API 호출

### 6.1 `v-model`로 폼 값 관리

```vue
<script setup>
import { ref } from 'vue'
const email = ref('')
const password = ref('')
</script>

<template>
  <input v-model="email" type="email">
  <input v-model="password" type="password">
</template>
```

### 6.2 클라이언트 사이드 폼 검증

서버에 보내기 전에 JS로 미리 형식을 확인하는 것. **주의**: 클라이언트 검증은 사용자 경험(UX)을 위한 것이고, 보안을 위해서는 **서버도 반드시 같은 검증을 다시 해야 함** (클라이언트 코드는 누구나 우회 가능).

```js
const errors = ref({})

function validate() {
  errors.value = {}
  if (!email.value.includes('@')) {
    errors.value.email = '올바른 이메일 형식이 아닙니다'
  }
  if (password.value.length < 8) {
    errors.value.password = '비밀번호는 8자 이상이어야 합니다'
  }
  return Object.keys(errors.value).length === 0
}
```

### 6.3 `fetch` 기초 — Promise와 `async/await`

`fetch`는 브라우저 내장 API로 네트워크 요청을 보냅니다. 결과가 **비동기**(오래 걸릴 수 있음)이기 때문에 `Promise`라는 객체를 반환합니다.

```js
// Promise 체인 방식
fetch('/api/login')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))

// async/await 방식 (같은 내용, 더 읽기 쉬움 — 요즘 표준)
async function fetchData() {
  try {
    const res = await fetch('/api/login')
    const data = await res.json()
    console.log(data)
  } catch (err) {
    console.error(err)
  }
}
```

- `await`: "이 Promise가 끝날 때까지 기다렸다가 다음 줄로" — `async` 함수 안에서만 사용 가능.
- `res.json()`: 응답 본문을 JS 객체로 파싱 (이것도 비동기라 await 필요).
- **`fetch`는 HTTP 에러(404, 500)를 자동으로 예외 처리하지 않음** — `res.ok`를 직접 확인해야 함:

```js
if (!res.ok) throw new Error(`HTTP ${res.status}`)
```

### 6.4 Vue와 조합하기 (로딩/에러 상태 패턴)

```vue
<script setup>
import { ref } from 'vue'

const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!validate()) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    if (!res.ok) throw new Error('로그인 실패')
    const data = await res.json()
    // 성공 처리 (7번 Pinia와 연결되는 지점)
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
```

- `loading`, `errorMsg` 같은 "요청 상태"를 반응형 변수로 관리하는 패턴은 실무에서 거의 항상 등장합니다.
- (참고) `axios`라는 라이브러리는 `fetch`보다 문법이 조금 더 편하고(자동 JSON 파싱, 에러를 자동으로 throw 등) 실무에서 널리 쓰이지만, 지금은 브라우저 내장 `fetch`로 원리를 먼저 익히는 게 좋습니다.

**실습에서 확인할 것**: 가짜 API(예: JSONPlaceholder 같은 공개 테스트 API, 또는 우리가 만들 mock 서버)에 fetch로 요청 → 로딩 스피너 표시 → 성공/실패에 따라 다른 화면 렌더링.

---

## 7. Pinia로 로그인 상태 공유 (선택)

### 7.1 왜 상태관리 라이브러리가 필요한가 — "Props Drilling" 문제

로그인 여부 같은 정보를 여러 화면(헤더, 마이페이지, 장바구니 등)에서 동시에 알아야 하는 경우, 이걸 props로만 계속 내려주면 중간 컴포넌트들이 쓰지도 않을 props를 계속 전달만 하는 상황이 생깁니다 (이를 **props drilling**이라 부름). 이걸 해결하려고 "어디서든 접근 가능한 전역 저장소"를 씁니다.

### 7.2 Pinia란

Vue 공식 상태관리 라이브러리 (예전의 Vuex를 대체). `<script setup>` 스타일과 잘 어울리고 문법이 단순합니다.

```bash
npm install pinia
```

```js
// main.js
import { createPinia } from 'pinia'
createApp(App).use(createPinia()).mount('#app')
```

### 7.3 스토어(store) 정의

```js
// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)  // state

  const isLoggedIn = computed(() => user.value !== null)  // getter

  function login(userData) {   // action
    user.value = userData
  }
  function logout() {
    user.value = null
  }

  return { user, isLoggedIn, login, logout }
})
```

이 문법("Setup Store"라고 부름)은 앞서 배운 `ref`/`computed`를 그대로 사용합니다 — Pinia는 사실 "컴포넌트 바깥에서도 쓸 수 있는 반응형 상태"라고 생각하면 이해하기 쉽습니다.

- **state**: 데이터 그 자체 (`user`)
- **getter**: state로부터 파생된 값 (`isLoggedIn` — computed와 동일한 개념)
- **action**: state를 바꾸는 함수 (`login`, `logout`)

### 7.4 컴포넌트에서 사용

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div v-if="authStore.isLoggedIn">
    안녕하세요, {{ authStore.user.name }}님
  </div>
  <div v-else>로그인이 필요합니다</div>
</template>
```

어느 컴포넌트에서든 `useAuthStore()`를 호출하면 **같은** 스토어 인스턴스를 공유합니다 — 그래서 헤더에서 로그인하면 다른 페이지에서도 즉시 반영됩니다.

**실습에서 확인할 것**: 6번에서 만든 로그인 폼의 fetch 성공 시 `authStore.login(data)` 호출 → 헤더 컴포넌트에서 `authStore.isLoggedIn`으로 로그인 여부 표시 → 새로고침해도 유지하려면 localStorage 연동이 필요하다는 것까지는 알아두되, 이건 다음 단계 주제.

---

## 8. 전체 학습 순서 요약

1. **환경 확인**: `node -v`, `npm -v`
2. **프로젝트 생성**: `npm create vue@latest` (Router, Pinia 옵션 켜기) → `npm install` → `npm run dev`
3. **템플릿 문법 놀이터**: App.vue 하나로 `{{ }}`, `v-bind`, `v-on`, `v-for`, `v-if`/`v-show` 실습
4. **반응형 놀이터**: `ref`/`reactive`로 카운터, `computed`로 파생값, `watch`로 감시 실습
5. **컴포넌트 쪼개기**: 목록 아이템을 자식 컴포넌트로 분리, props로 데이터 내리고 emit으로 이벤트 올리기
6. **라우팅**: 목록 페이지 + 상세 페이지, `:id` 동적 라우트
7. **폼 + API**: 검색/로그인 폼 만들고 fetch로 실제(또는 mock) API 호출, 로딩/에러 상태 처리
8. **Pinia**: 로그인 상태를 스토어로 옮겨서 여러 컴포넌트에서 공유

각 단계는 이전 단계 위에 쌓이는 구조이므로, 순서를 크게 건너뛰지 않는 걸 권장합니다.

---

## 부록: 용어 미니 사전

| 용어 | 한 줄 설명 |
|---|---|
| SPA | 새로고침 없이 JS가 화면을 갈아끼우는 웹앱 방식 |
| 반응형(Reactivity) | 데이터 변경 시 화면이 자동으로 갱신되는 성질 |
| 디렉티브 | `v-`로 시작하는 템플릿 지시문 |
| SFC | `.vue` 파일 하나에 template/script/style을 모은 단위 |
| Composition API | `<script setup>`, `ref`/`reactive`/`computed` 등을 쓰는 Vue 3 방식 |
| props | 부모→자식으로 내려주는 데이터 |
| emit | 자식→부모로 올리는 커스텀 이벤트 |
| 라우팅 | URL 경로에 따라 다른 화면(컴포넌트)을 보여주는 것 |
| Promise | 비동기 작업의 결과를 나중에 전달받기 위한 객체 |
| async/await | Promise를 동기 코드처럼 읽기 쉽게 쓰는 문법 |
| 상태관리(State Management) | 여러 컴포넌트가 공유하는 데이터를 한 곳에서 관리하는 방식 |
| store | 상태관리 라이브러리(Pinia)에서 상태를 담는 단위 |
