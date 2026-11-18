# study6 — DB·API 연동

> 🎯 **목표**: 프론트(Vue)는 DB에 직접 접근하지 않고 **HTTP API**로 CRUD 한다는 구조를 이해하고, `fetch` 클라이언트를 만들어 공개 API → 실제 백엔드 API 순서로 게시판 CRUD와 작성·수정 화면을 만든다.

- 이전: [study5](./study5.md) 폼 검증
- 대응 코드: [`demo/src/components/FetchApiPractice.vue`](./demo/src/components/FetchApiPractice.vue)(JSONPlaceholder), [`project/final/src/api/`](./project/final/src/api)(`client.ts`·`posts.ts`·`comments.ts`·`auth.ts`), [`project/final/src/views/PostFormView.vue`](./project/final/src/views/PostFormView.vue)
- 백엔드: [`backend-django/`](./backend-django) — Django 로 구현한 공통 API 스펙 v1 서버. 프론트는 이 서버와 개발용 `api-server.js` 어느 쪽에도 코드 수정 없이 붙습니다.
- 구현 메모: `project/final/` 는 [study14](./study14.md) 이후 TypeScript(`.ts`)라 아래 JS 예시와 확장자·타입만 다릅니다. 백엔드가 없는 동안은 **MSW 목 서버**(`project/final/src/mocks/`)가 공통 API 스펙 v1 을 흉내 냅니다(`npm run dev` 기본값).

---

## 📖 이론

### 6.1 DB는 서버 몫, 프론트는 API 호출

```
Vue(브라우저)  ──HTTP + JSON──▶  백엔드 API  ──SQL──▶  DB
              ◀──────────────                ◀──────
```

- 브라우저에 DB 계정·비밀번호를 둘 수 없다. 프론트가 아는 것은 **API 주소와 규칙**뿐이다.
- 이 저장소는 백엔드와 **「공통 API 스펙 v1」** 을 약속으로 삼는다. 이 스펙만 지키면 백엔드를 바꿔도 프론트 코드는 그대로다.

### 6.2 CRUD ↔ HTTP 메소드 (공통 API 스펙 v1)

| 동작 | 메소드 · 경로 | 인증 | 성공 상태 |
|---|---|---|---|
| 목록 | `GET /api/posts?q=&page=&limit=&sort=` | 불필요 | 200 |
| 상세 | `GET /api/posts/{id}` | 불필요 | 200 |
| 작성 | `POST /api/posts` | 필요 | 201 |
| 수정 | `PATCH /api/posts/{id}` | 작성자 | 200 |
| 삭제 | `DELETE /api/posts/{id}` | 작성자 | 204 (본문 없음) |

성공 응답은 `{ "data": ... }`, 목록은 `{ "data": [...], "meta": { page, limit, total, totalPages } }`. 오류는 `{ "error": { code, message, fields, requestId } }`.

### 6.3 `fetch`의 함정

- `fetch`는 **404/500도 reject하지 않는다.** 네트워크 자체가 실패할 때만 reject. → `res.ok`를 직접 확인해야 한다.
- 응답 본문은 `await res.json()`으로 따로 읽는다. 204는 본문이 없으므로 `json()`을 호출하면 안 된다.
- 상태 3종 세트: **loading / error / success**를 항상 같이 관리한다.

### 6.4 CORS와 개발 프록시

브라우저는 다른 출처(`localhost:5173` → `localhost:8000`)로의 요청을 서버가 허락(CORS 헤더)하지 않으면 막습니다. 해결은 두 가지입니다.

| 방법 | 설명 |
|---|---|
| 서버 CORS 허용 | 서버가 `CORS_ORIGIN=http://localhost:5173`을 허용 (스펙 v1 §7) |
| **Vite 프록시** | 개발 중 Vite가 `/api` 요청을 백엔드로 대신 전달 → 브라우저 입장에서는 같은 출처 |

---

## 🛠️ 실기

### 실습 1. 공개 API로 CRUD 감 잡기 (JSONPlaceholder)

백엔드가 없어도 연습할 수 있습니다. 단, JSONPlaceholder는 **쓰기를 흉내만 내고 저장하지 않습니다**(응답은 오지만 새로고침하면 그대로).

```js
// 목록
const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
// 작성
await fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '새 글', body: '내용', userId: 1 }),
})
// 수정 / 삭제
await fetch('https://jsonplaceholder.typicode.com/posts/1', { method: 'PATCH', headers: {...}, body: JSON.stringify({ title: '수정' }) })
await fetch('https://jsonplaceholder.typicode.com/posts/1', { method: 'DELETE' })
```

### 실습 2. loading/error/success 패턴 (`FetchApiPractice.vue`)

```js
async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/users?_limit=5')
    if (!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
    users.value = await res.json()
  } catch (err) {
    errorMessage.value = err.message || '데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}
```

| 줄 | 설명 |
|---|---|
| `loading.value = true` | 요청 시작 → "불러오는 중" 화면 |
| `if (!res.ok) throw ...` | HTTP 오류를 예외로 바꿔 아래 `catch`로 보낸다 |
| `catch (err)` | 네트워크 단절, CORS, 위에서 던진 오류 모두 여기서 |
| `finally` | 성공이든 실패든 **반드시** 로딩 종료 |

### 실습 3. 실제 백엔드용 API 클라이언트 — `src/api/client.js`

```js
// src/api/client.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''   // 프록시를 쓰면 빈 문자열

export class ApiError extends Error {
  constructor({ status, code, message, fields, requestId }) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
    this.requestId = requestId
  }
}

export async function request(path, { method = 'GET', body, token } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK', message: '서버에 연결할 수 없습니다.' })
  }

  if (res.status === 204) return null                // DELETE 등 본문 없음

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const e = json?.error ?? {}
    throw new ApiError({
      status: res.status,
      code: e.code ?? 'UNKNOWN',
      message: e.message ?? `요청 실패 (HTTP ${res.status})`,
      fields: e.fields,
      requestId: e.requestId,
    })
  }
  return json
}
```

| 줄 | 설명 |
|---|---|
| `import.meta.env.VITE_API_BASE_URL` | 환경 변수 (study8에서 `.env`로 관리). 빈 값이면 같은 출처로 요청 → Vite 프록시 사용 |
| `class ApiError` | 화면이 `status`/`code`/`fields`를 보고 분기할 수 있게 **오류를 구조화** |
| `try { fetch } catch` | 서버 연결 불가는 `status: 0`, `NETWORK`으로 통일 |
| `res.status === 204` | 삭제 성공 응답은 본문이 없다 |
| `res.json().catch(() => null)` | 서버가 JSON이 아닌 오류 페이지를 줘도 앱이 죽지 않게 |
| `error.fields` | study5의 폼에서 필드별 오류 표시에 사용 |

### 실습 4. 게시글 API 모듈 — `src/api/posts.js`

```js
import { request } from './client.js'

export const listPosts = ({ q, page = 1, limit = 10, sort = '-createdAt' } = {}) => {
  const params = new URLSearchParams({ page, limit, sort })
  if (q) params.set('q', q)
  return request(`/api/posts?${params}`)            // { data: [...], meta: {...} }
}

export const getPost = (id) => request(`/api/posts/${id}`).then((r) => r.data)

export const createPost = (body, token) =>
  request('/api/posts', { method: 'POST', body, token }).then((r) => r.data)

export const updatePost = (id, body, token) =>
  request(`/api/posts/${id}`, { method: 'PATCH', body, token }).then((r) => r.data)

export const deletePost = (id, token) =>
  request(`/api/posts/${id}`, { method: 'DELETE', token })
```

- 화면에서는 `fetch` 주소를 직접 쓰지 않고 `listPosts()`처럼 **함수 이름으로** 호출한다 → 주소·형식이 바뀌어도 이 파일만 고친다.
- `URLSearchParams`가 한글/특수문자를 자동 인코딩한다.

### 실습 5. Vite 프록시로 CORS 우회 — `vite.config.js`

```js
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',   // 백엔드 개발 서버 주소
    },
  },
})
```

| 줄 | 설명 |
|---|---|
| `server.proxy['/api']` | 브라우저가 `localhost:5173/api/...`로 보낸 요청을 Vite가 `localhost:8000/api/...`로 전달 |
| 효과 | 개발 중 CORS 설정이 필요 없다. **운영에서는 프록시가 없으므로** 서버 CORS 또는 리버스 프록시가 필요 ([study17](./study17.md)) |

### 실습 6. 목록·삭제 연결 (`PostListView.vue` 발췌)

```js
import { listPosts, deletePost } from '../api/posts.js'

const meta = ref({ page: 1, totalPages: 1 })

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data, meta: m } = await listPosts({ q: keyword.value, page: meta.value.page })
    posts.value = data
    meta.value = m
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function remove(id) {
  if (!confirm('삭제할까요?')) return
  await deletePost(id, authStore.token)
  posts.value = posts.value.filter((p) => p.id !== id)   // 서버 204 후 화면에서 제거
}
```

### 실습 7. 작성·수정 화면 — `PostFormView.vue`

라우트(로그인 필요, [study7](./study7.md)의 `meta.requiresAuth`):

```js
{ path: '/posts/new', name: 'post-new', component: () => import('../views/PostFormView.vue'), meta: { requiresAuth: true } },
{ path: '/posts/:id/edit', name: 'post-edit', component: () => import('../views/PostFormView.vue'), meta: { requiresAuth: true } },
```

> `/posts/new`는 `/posts/:id`보다 **먼저** 선언한다. (vue-router는 구체성을 점수로 비교해 대부분 알아서 맞추지만, 선언 순서도 명시해 두면 읽기 쉽다.)

```vue
<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, createPost, updatePost } from '../api/posts.js'
import { useAuthStore } from '../stores/auth.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.params.id)
const form = reactive({ title: '', body: '' })
const serverErrors = ref({})
const saving = ref(false)

onMounted(async () => {
  if (isEdit.value) Object.assign(form, pick(await getPost(route.params.id)))
})
const pick = ({ title, body }) => ({ title, body })

async function submit() {
  saving.value = true
  serverErrors.value = {}
  try {
    const saved = isEdit.value
      ? await updatePost(route.params.id, { ...form }, authStore.token)
      : await createPost({ ...form }, authStore.token)
    router.push({ name: 'post-detail', params: { id: saved.id } })
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') serverErrors.value = err.fields ?? {}
    else alert(err.message)
  } finally {
    saving.value = false
  }
}
</script>
```

| 줄 | 설명 |
|---|---|
| `isEdit` | 같은 컴포넌트를 `new`와 `edit`가 공유 — URL에 `:id`가 있으면 수정 모드 |
| `Object.assign(form, ...)` | `reactive` 객체의 **연결을 유지한 채** 값만 채워 넣는다 (교체하면 반응성이 끊김) |
| `createPost` / `updatePost` | 모드에 따라 POST / PATCH |
| `router.push({ name, params })` | 저장 후 상세로 이동 |
| `err.code === 'VALIDATION_ERROR'` | 서버 검증 오류는 필드 아래에 표시, 그 외는 알림 |

### 실행 확인

```bash
# 터미널 1: 백엔드 (공통 API 스펙 v1을 구현한 서버. 예: http://localhost:8000)
# 터미널 2:
cd project/final && npm run dev
```

1. 서버가 꺼진 상태에서 목록 → "서버에 연결할 수 없습니다" 오류 + 다시 시도 버튼
2. 서버를 켜고 다시 시도 → 목록 표시
3. Network 탭에서 `/api/posts?...` 요청이 **5173 주소로** 나가고 200으로 오는지 (프록시 동작)
4. 작성 → 목록에 보이는가, 새로고침해도 남아 있는가(진짜 DB에 저장된 증거)
5. 제목을 비운 채 저장 → 서버의 `fields.title` 오류가 표시되는가

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| Console: `blocked by CORS policy` | 서버가 개발 출처를 허용하지 않음 | 서버 `CORS_ORIGIN=http://localhost:5173` 또는 Vite 프록시 사용 |
| 프록시를 설정했는데 `404` | 프론트가 `http://localhost:8000/...` 절대 주소로 호출 중 | `VITE_API_BASE_URL`을 비우고 `/api/...` 상대 경로 사용. `vite.config` 수정 후 **dev 서버 재시작** |
| 서버 오류인데 화면에는 "성공"처럼 동작 | `res.ok` 확인 누락 | 클라이언트에서 `!res.ok`일 때 `throw` |
| `Unexpected end of JSON input` | 204(본문 없음)에 `res.json()` 호출 | `status === 204` 분기 |
| `Unexpected token '<', "<!DOCTYPE"...` | JSON이 아닌 HTML(404 페이지 등)을 받음 | 주소/프록시 확인, `res.json().catch(() => null)` |
| 수정 폼이 빈 칸 | `getPost` 완료 전에 렌더 | 로딩 표시 후 채우기, 또는 `v-if="!loading"` |
| 수정 시 값이 서버에 안 바뀜 | PATCH 본문 키 이름 불일치 (`content` vs `body`) | 스펙 v1 필드명(`title`, `body`, `tags`) 확인. camelCase |
| 삭제 후 목록에 그대로 있음 | 서버 성공 후 로컬 상태 갱신 누락 | `filter`로 제거하거나 목록 재조회 |
| 응답 `data`를 못 찾음 | 응답이 `{ data: ... }`로 감싸져 있음 | `await request(...)`가 아니라 `.data` 꺼내기 |

---

## ☐ 체크리스트

- ☑ `fetch`로 GET 요청, `res.ok` 확인, loading/error/success 3종 상태 관리 (JSONPlaceholder)
- ☑ `Promise.all`로 상세·댓글 병렬 요청 ([study4](./study4.md))
- ☑ 오류 시 "다시 시도" 버튼 제공
- ☑ `src/api/client.js`(오류 구조화) + `src/api/posts.js` 작성 — `project/final/src/api/client.ts`, `posts.ts`
- ☑ **대표 조합 2번(Vue + Django + MySQL)의 Django API에 게시판 연결 — CORS 또는 Vite 프록시** — [`backend-django/`](./backend-django)(Django, 스펙 v1, 테스트 23개)에 `project/midpoint` 를 **Vite 프록시**와 **CORS 직접 호출** 두 방식으로 연결해 브라우저에서 로그인·작성·수정·삭제·댓글·404·409 흐름을 확인했다(각 13개 시나리오 통과). DB 는 SQLite 로 검증했고 MySQL 은 `DB_ENGINE=mysql` 설정만 준비했다(MySQL 서버로는 실행하지 않음).
- ☑ 목록의 검색(`q`)·페이지(`page`/`meta.totalPages`) 연결 — `PostListView` (디바운스·URL 동기화·취소 포함)
- ☑ **작성·수정 화면** (`PostFormView.vue`, 서버 `error.fields` 표시) — Notion 체크 항목 — `PostFormView.vue`
- ☑ 삭제 (204 처리 + 화면 갱신) — `PostDetailView.vue`

## ➡️ 다음 단계 연결

작성·수정·삭제는 **로그인한 사람만, 본인 글만** 가능해야 합니다. [study7](./study7.md)에서 가상 로그인을 실제 로그인(`accessToken`)으로 바꾸고 401/403을 처리합니다.
