# study4 — 라우팅·요청 처리

> 🎯 **목표**: Vue Router로 URL과 화면을 연결하고(목록 → 상세), "URL 변경 → 화면 전환 → 데이터 요청 → 응답 표시"의 흐름을 이해한다.

- 이전: [study3](./study3.md) 데이터 다루기
- 대응 코드: [`demo/src/router/index.js`](./demo/src/router/index.js), [`project/src/router/index.js`](./project/src/router/index.js), `ProductListView.vue`, `ProductDetailView.vue`, `PostDetailView.vue`

---

## 📖 이론

### 4.1 왜 라우터가 필요한가

SPA는 HTML이 하나뿐이라 주소(URL)가 바뀌어도 서버에서 새 페이지를 받지 않습니다. **Vue Router**가 URL을 감시하다가 일치하는 컴포넌트를 `<RouterView>` 자리에 그려줍니다. 새로고침 없이 URL·뒤로가기·북마크가 동작하게 하는 장치입니다.

### 4.2 요청·응답 흐름 (SPA 관점)

```
사용자가 링크 클릭 (<RouterLink to="/posts/3">)
   │  브라우저가 서버에 요청하지 않음 (History API로 주소만 변경)
   ▼
Vue Router가 URL과 routes 배열을 비교 → '/posts/:id' 일치, params.id = '3'
   │
   ▼
해당 View 컴포넌트가 <RouterView> 자리에 마운트 (lazy import면 이때 js 청크 다운로드)
   │
   ▼
View의 onMounted / watch에서 fetch 요청 → 서버(API)가 JSON 응답
   │
   ▼
응답 데이터를 ref에 저장 → 템플릿 자동 갱신 (로딩 → 성공/실패)
```

### 4.3 핵심 API

| API | 역할 |
|---|---|
| `createRouter({ history, routes })` | 라우터 생성 |
| `createWebHistory()` | 깔끔한 URL(`/posts/3`). 서버에 SPA fallback 설정 필요 (study10) |
| `<RouterLink to="...">` | `<a>` 대신 사용. 페이지 새로고침 없이 이동 |
| `<RouterView />` | 일치한 컴포넌트가 그려지는 자리 |
| `useRoute()` | **현재 라우트 정보 읽기** (`params`, `query`, `path`) |
| `useRouter()` | **이동 명령 내리기** (`push`, `replace`, `back`) |
| `route.params.id` | `/posts/:id`의 `:id`. **항상 문자열** |
| `route.query.q` | `?q=검색어` |

---

## 🛠️ 실기

### 실습 1. 라우트 설정 — `project/src/router/index.js`

```js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'post-list', component: () => import('../views/PostListView.vue') },
    { path: '/posts/:id', name: 'post-detail', component: () => import('../views/PostDetailView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  ],
})

export default router
```

| 줄 | 설명 |
|---|---|
| `createWebHistory(import.meta.env.BASE_URL)` | `vite.config`의 `base` 값을 따르는 History 모드 |
| `path: '/posts/:id'` | `:id`는 동적 파라미터 |
| `name` | 이름으로 이동 가능 (`router.push({ name: 'post-detail', params: { id: 3 } })`) |
| `() => import(...)` | **지연 로딩**. 해당 화면에 처음 들어갈 때 파일을 내려받아 초기 번들이 작아진다 |

### 실습 2. 목록 → 상세 링크

```vue
<RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
<!-- 또는 이름 기반 -->
<RouterLink :to="{ name: 'post-detail', params: { id: post.id } }">{{ post.title }}</RouterLink>
```

### 실습 3. 상세 — 파라미터 읽기 + 병렬 요청 (`PostDetailView.vue`)

```js
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const post = ref(null)
const comments = ref([])

async function fetchPostDetail(id) {
  const [postRes, commentsRes] = await Promise.all([
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}`),
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}/comments`),
  ])
  post.value = await postRes.json()
  comments.value = await commentsRes.json()
}

onMounted(() => fetchPostDetail(route.params.id))

watch(() => route.params.id, (newId) => fetchPostDetail(newId))
```

| 줄 | 설명 |
|---|---|
| `useRoute()` | 현재 URL 정보. 반응형이다 |
| `Promise.all([...])` | 본문과 댓글을 **동시에** 요청, 둘 다 끝나면 진행 → 대기 시간 단축 |
| `onMounted(...)` | 화면에 처음 들어왔을 때 1회 실행 |
| `watch(() => route.params.id, ...)` | 같은 라우트에서 `id`만 바뀌면(예: 다음 글 링크) 컴포넌트가 **재사용**되어 `onMounted`가 다시 안 불리므로 `params.id`를 감시해야 한다 |

### 실습 4. 코드로 이동 — `useRouter()`

```js
import { useRouter } from 'vue-router'
const router = useRouter()

function goBack() {
  router.push('/')          // 히스토리에 쌓기 (뒤로가기 가능)
}
router.replace('/login')    // 히스토리 교체 (뒤로가기 불가)
router.back()               // 브라우저 뒤로가기
```

로그인 성공 후 목록으로 이동할 때(`LoginView`) `router.push('/')`를 사용합니다.

### 실습 5. 쿼리스트링으로 검색어 유지 (직접 해보기)

```js
const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.q ?? '')

watch(keyword, (q) => {
  router.replace({ query: q ? { q } : {} })   // /?q=vue
})
```

새로고침하거나 URL을 공유해도 검색어가 유지됩니다.

### 실습 6. 없는 주소(404) 처리

```js
{
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('../views/NotFoundView.vue'),
}
```

가장 **마지막**에 두는 catch-all 라우트. 위의 어떤 경로와도 맞지 않을 때 보여줍니다. 또 상세 화면에서는 데이터가 없을 때 "찾을 수 없습니다" 메시지와 목록 링크를 보여줍니다.

### 실습 7. 스크롤 · 활성 링크

```js
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }          // 화면 전환 시 맨 위로
  },
  routes: [...],
})
```

`<RouterLink>`는 현재 URL과 일치하면 `router-link-exact-active` 클래스를 붙여 줍니다 (`AppHeader`의 활성 메뉴 스타일링에 사용).

### 실행 확인

```bash
cd project && npm run dev
```

1. 목록 카드 클릭 → 주소가 `/posts/3`으로 바뀌고 새로고침 없이 상세가 보이는가
2. 개발자도구 Network 탭: 이동 시 **HTML 문서 요청이 없고** `fetch`(XHR) 요청만 나가는가
3. `/posts/999999`, `/abc` 직접 입력 → 빈 화면/오류 없이 안내가 나오는가
4. 뒤로가기 → 목록 상태로 돌아오는가

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 상세에서 다른 id로 바뀌었는데 내용이 그대로 | 컴포넌트가 재사용되어 `onMounted`가 다시 안 불림 | `watch(() => route.params.id, ...)` |
| `route.params.id === 1`이 항상 거짓 | `params`는 문자열 | `Number(route.params.id)` 또는 `String` 비교 |
| `Cannot read properties of undefined (reading 'params')` | `useRoute()`를 `setup` 밖에서 호출 | `<script setup>` 최상단에서 호출 |
| `[Vue Router warn]: No match found for location with path "/..."` | 라우트 미등록 | 경로 오타 확인, catch-all 라우트 추가 |
| 새로고침하면 `404 Not Found` (배포 환경) | 서버가 `/posts/3`을 실제 파일로 찾음 | 서버에서 모든 경로를 `index.html`로 fallback ([study10](./study10.md)) |
| `useRoute`와 `useRouter`를 혼동 | 읽기(`route`) vs 이동(`router`) | `route`=읽기, `router`=이동으로 기억 |
| 링크가 전체 새로고침됨 | `<a href>`를 사용 | `<RouterLink to>` 사용 |

---

## ☐ 체크리스트

- ☑ `routes` 배열에 목록(`/`)·상세(`/posts/:id`)·로그인(`/login`) 등록
- ☑ `<RouterLink>`/`<RouterView>`로 화면 전환
- ☑ `route.params.id`로 상세 데이터 요청, `Promise.all`로 병렬 fetch
- ☑ 같은 라우트에서 id만 바뀌는 경우를 `watch`로 처리
- ☑ `useRoute`(읽기)와 `useRouter`(이동)를 구분
- ☐ 쿼리스트링(`?q=`)으로 검색어 유지 (실습 5)
- ☐ 404 catch-all 라우트 + `NotFoundView.vue` 추가 (실습 6)
- ☐ Network 탭에서 "HTML 요청 없이 화면이 전환됨"을 직접 확인

## ➡️ 다음 단계 연결

화면과 URL이 연결되었으니, 사용자가 **입력**하는 값을 받고 검증하는 방법을 [study5](./study5.md)에서 다룹니다. 로그인 화면(`/login`)이 그 첫 사례입니다.
