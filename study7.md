# study7 — 인증·보안 기초

> 🎯 **목표**: Pinia로 로그인 상태를 공유하고, 가상 로그인을 **실제 로그인(`accessToken`)** 으로 바꾸며, 새로고침 후 유지·라우트 가드·401/403 처리를 구현한다.

- 이전: [study6](./study6.md) DB·API 연동
- 대응 코드: [`demo/src/stores/auth.js`](./demo/src/stores/auth.js)(가상 로그인), [`project/src/stores/auth.ts`](./project/src/stores/auth.ts)(실제 로그인·토큰), [`project/src/router/index.ts`](./project/src/router/index.ts)(가드), [`project/src/api/client.ts`](./project/src/api/client.ts)(401 처리)
- 구현 메모: `project/` 는 TypeScript 이고, 스토어↔라우터 순환 import 를 피하려고 `authed()` 대신 `configureApi({ getToken, onUnauthorized })` 훅을 `main.ts` 에서 주입합니다.

---

## 📖 이론

### 7.1 Pinia — 컴포넌트 밖의 반응형 상태

로그인 여부는 헤더·목록·상세·작성 화면이 모두 알아야 하는 **전역 상태**입니다. props/emit으로 멀리 떨어진 컴포넌트에 전달하면 중간 컴포넌트가 데이터를 계속 넘겨야 합니다(props drilling). Pinia는 어디서든 `useAuthStore()`로 **같은 인스턴스**를 받게 해 줍니다.

Setup Store 규칙: `ref` → state, `computed` → getter, 함수 → action. 컴포넌트에서 쓰던 API와 같습니다.

### 7.2 인증(Authentication) vs 인가(Authorization)

| 용어 | 질문 | 예 |
|---|---|---|
| 인증 | 너는 누구인가? | 로그인 |
| 인가 | 너는 이걸 해도 되는가? | 내 글만 수정 |

### 7.3 토큰 방식의 흐름

```
로그인 요청 (이메일·비밀번호)
   ▼
서버: 확인 후 accessToken(JWT 등) 발급 → { data: { user, accessToken } }
   ▼
프론트: 토큰 보관 → 이후 요청마다 Authorization: Bearer <accessToken>
   ▼
서버: 토큰 검증. 없음/만료/위조 → 401, 권한 없음 → 403
```

| 상태 | 의미 | 프론트의 반응 |
|---|---|---|
| 401 `UNAUTHORIZED` | 로그인 안 됨 / 토큰 만료 | 토큰 폐기 → 로그인 화면으로 |
| 401 `INVALID_CREDENTIALS` | 로그인 실패 | 폼에 "이메일 또는 비밀번호가 올바르지 않습니다" |
| 403 `FORBIDDEN` | 로그인했지만 권한 없음 (남의 글) | 안내 메시지 (로그인 화면으로 보내지 않는다) |

### 7.4 토큰을 어디에 보관하나 (보안 트레이드오프)

| 위치 | 장점 | 단점 |
|---|---|---|
| 메모리(Pinia state) | XSS로 탈취되기 어렵다 | 새로고침하면 사라진다 |
| `localStorage` | 새로고침 후 유지, 구현 쉬움 | **XSS가 있으면 JS로 읽혀 탈취**된다 |
| httpOnly 쿠키 | JS가 읽을 수 없어 XSS에 강함 | CSRF 대책 필요, 서버와 같은 사이트 구성이 편함 |

학습용은 `localStorage`로 구현하되, 위험을 알고 쓰는 것이 핵심입니다. 운영에서는 짧은 만료(1시간) + XSS 방어([study16](./study16.md)) 또는 httpOnly 쿠키를 고려합니다.

### 7.5 프론트 인가의 한계

화면에서 버튼을 숨기는 것은 **UX**일 뿐 보안이 아닙니다. 진짜 권한 검사는 항상 서버가 합니다. (개발자도구로 요청을 직접 보낼 수 있다.)

---

## 🛠️ 실기

### 실습 1. 현재 상태 — 가상 로그인 (참고)

`project/src/stores/auth.js`는 JSONPlaceholder 사용자 목록에서 이메일이 일치하면 성공 처리하는 **목업**입니다. 비밀번호는 길이만 확인합니다. 이를 아래처럼 실제 서버 로그인으로 교체합니다.

### 실습 2. 실제 로그인 스토어 — `stores/auth.js` (토큰 + 새로고침 유지)

```js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../api/client.js'

const TOKEN_KEY = 'mini-board:token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem(TOKEN_KEY))   // 시작할 때 복원
  const loading = ref(false)
  const errorMessage = ref('')

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function setSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
  }

  async function login({ email, password }) {
    loading.value = true
    errorMessage.value = ''
    try {
      const { data } = await request('/api/auth/login', { method: 'POST', body: { email, password } })
      setSession(data.accessToken, data.user)
      return true
    } catch (err) {
      errorMessage.value = err.code === 'INVALID_CREDENTIALS'
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // 앱 시작 시 토큰이 남아 있으면 /me 로 사용자 정보를 다시 가져온다
  async function restore() {
    if (!token.value) return
    try {
      const { data } = await request('/api/auth/me', { token: token.value })
      user.value = data
    } catch {
      setSession(null, null)   // 만료·위조 토큰 → 정리
    }
  }

  function logout() {
    setSession(null, null)
  }

  return { user, token, loading, errorMessage, isLoggedIn, login, restore, logout }
})
```

| 줄 | 설명 |
|---|---|
| `ref(localStorage.getItem(TOKEN_KEY))` | 새로고침해도 토큰이 남아 있으면 복원 |
| `isLoggedIn = !!token && !!user` | 토큰만으로는 부족 — 사용자 정보까지 확인되어야 로그인으로 취급 |
| `setSession` | 메모리와 `localStorage`를 **한 곳에서** 함께 갱신 (둘이 어긋나는 버그 방지) |
| `err.code === 'INVALID_CREDENTIALS'` | 서버가 이메일/비밀번호 중 무엇이 틀렸는지 숨기므로 화면 문구도 동일하게 |
| `restore()` | `GET /api/auth/me`로 토큰이 아직 유효한지 서버에 확인. 실패하면 로그아웃 처리 |

> `pinia-plugin-persistedstate`를 쓰면 `localStorage` 연동을 선언만으로 할 수 있습니다. 단, 설치 전 현재 Pinia 메이저 버전(이 저장소는 4.x)과의 호환을 확인하세요. 호환이 불확실할 땐 위 수동 방식이 가장 안전합니다.

### 실습 3. 앱 시작 시 한 번 복원 — `main.js`

```js
const app = createApp(App)
app.use(createPinia())
app.use(router)

const auth = useAuthStore()
auth.restore().finally(() => app.mount('#app'))   // 복원 끝난 뒤 첫 화면을 그린다
```

복원이 끝나기 전에 마운트하면 로그인 사용자가 잠깐 "로그아웃 상태"로 보이는 깜빡임이 생깁니다.

### 실습 4. 라우트 가드 — 로그인 필요 화면 막기

```js
// router/index.js
{ path: '/posts/new', component: ..., meta: { requiresAuth: true } },

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }   // 돌아올 주소 기억
  }
})
```

로그인 성공 후:

```js
router.push(route.query.redirect || '/')
```

| 줄 | 설명 |
|---|---|
| `meta: { requiresAuth: true }` | 라우트에 붙이는 임의의 표식 |
| `router.beforeEach((to) => ...)` | 모든 이동 직전 실행. **객체를 반환하면 그 위치로 리다이렉트** |
| `useAuthStore()`를 함수 **안에서** 호출 | 모듈 최상단에서 호출하면 Pinia가 아직 설치되기 전일 수 있다 |
| `query.redirect` | 로그인하면 원래 가려던 화면으로 복귀 |

### 실습 5. 요청마다 토큰 + 401/403 분기

API 호출을 한 곳에서 감싸 **401이면 자동 로그아웃**, **403이면 안내**로 처리합니다.

```js
// stores/auth.js 안에 추가
async function authed(path, options = {}) {
  try {
    return await request(path, { ...options, token: token.value })
  } catch (err) {
    if (err.status === 401) {
      setSession(null, null)
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    throw err         // 403 등은 호출한 화면이 처리
  }
}
```

화면에서:

```js
try {
  await auth.authed(`/api/posts/${id}`, { method: 'DELETE' })
} catch (err) {
  if (err.status === 403) message.value = '본인이 쓴 글만 삭제할 수 있습니다.'
  else if (err.status !== 401) message.value = err.message   // 401은 이미 로그인 화면으로 이동
}
```

| 상태 | 처리 | 이유 |
|---|---|---|
| 401 | 토큰 폐기 + 로그인 화면 이동 | 인증이 풀렸으니 다시 로그인이 해법 |
| 403 | 현재 화면에 안내 메시지 | 로그인은 되어 있으니 로그인 화면은 의미 없음 |

> `router`는 `import router from '../router'`로 가져옵니다. 스토어↔라우터 순환 import가 생기면 `authed`를 별도 파일로 분리합니다.

### 실습 6. 인가 UI — 내 글에만 수정·삭제 버튼

```vue
<script setup>
const isMine = computed(() => auth.user?.id === post.value?.author.id)
</script>

<template>
  <div v-if="isMine">
    <RouterLink :to="{ name: 'post-edit', params: { id: post.id } }">수정</RouterLink>
    <button @click="remove">삭제</button>
  </div>
</template>
```

버튼을 숨기는 것은 UX이며, 서버가 여전히 403으로 막는지 반드시 확인합니다.

### 실행 확인

1. 올바른 계정으로 로그인 → 헤더에 닉네임 표시 → **새로고침해도 로그인 유지**
2. 개발자도구 Application → Local Storage에 토큰이 저장되었는지, 로그아웃하면 사라지는지
3. 로그아웃 상태로 `/posts/new` 직접 접근 → `/login?redirect=/posts/new`로 이동 → 로그인 후 원래 화면으로
4. Local Storage의 토큰을 아무 문자열로 바꾼 뒤 새로고침 → 자동 로그아웃(restore 실패)
5. 남의 글 삭제를 API로 직접 시도 → 403 안내 메시지
6. 비밀번호 틀림 → "이메일 또는 비밀번호가 올바르지 않습니다."

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 새로고침하면 로그아웃 | 토큰을 메모리에만 보관 | `localStorage` 저장 + 시작 시 `restore()` |
| 새로고침 직후 잠깐 로그아웃 상태로 깜빡임 | `restore()` 끝나기 전에 화면을 그림 | 복원 완료 후 `mount`, 또는 `ready` 플래그 |
| `getActivePinia()` was called but there was no active Pinia | 모듈 최상단에서 `useStore()` 호출 | 가드·함수 **내부**에서 호출 |
| 모든 요청이 401 | `Authorization` 헤더 누락 / `Bearer ` 접두어 오타 | `Authorization: Bearer ${token}` |
| 401인데 로그인 화면으로 안 감 | 가드는 이동 시에만 동작 — API 응답 401은 별도 처리 필요 | `authed()` 같은 공통 처리 |
| 로그아웃 후 이전 사용자 즐겨찾기가 남음 | 다른 스토어 상태를 안 지움 | 로그아웃 시 관련 스토어 `$reset()`/초기화 |
| 무한 리다이렉트(`/login` ↔ `/login`) | `/login`에도 `requiresAuth`를 걸었거나 가드가 `/login`을 막음 | 가드에서 `to.name !== 'login'` 확인 |
| JWT 만료 후에도 화면은 로그인 상태 | 만료를 클라이언트가 모름 | `restore()` / 401 처리로 감지 |

---

## ☐ 체크리스트

- ☑ Pinia setup store(`ref`/`computed`/함수)로 로그인 상태 공유, 헤더·로그인·목록에서 같은 스토어 사용
- ☑ 가상 로그인(JSONPlaceholder 이메일 매칭)으로 흐름 확인
- ☑ **가상 로그인을 실제 로그인으로 — 응답의 `accessToken` 처리** (`POST /api/auth/login`) — `POST /api/auth/login` (MSW 목 서버로 검증, 실제 서버 연결은 프록시 주소만 바꾸면 됨)
- ☑ **새로고침 후 로그인 유지** (`localStorage` + `restore()`, 또는 검증된 persist 플러그인/쿠키) — `localStorage` + `restore()`, 복원 후에 라우터를 설치해 깜빡임 방지
- ☑ **401이면 로그인 화면, 403이면 안내 메시지로 분기** — `api/client.ts` 의 `onUnauthorized` 훅 + 화면별 403 안내
- ☑ `router.beforeEach` + `meta.requiresAuth`로 작성·수정 화면 보호, 로그인 후 `redirect` 복귀 — `meta.requiresAuth`/`guestOnly`, `redirect` 복귀 (열린 리다이렉트 방지)
- ☑ 내 글(`author.id === user.id`)에만 수정·삭제 버튼 표시 — `PostDetailView`, 댓글 삭제 버튼
- ☐ `localStorage` 토큰의 XSS 위험을 한 문장으로 설명할 수 있다

## ➡️ 다음 단계 연결

인증까지 붙으면 파일이 늘어나 정리가 필요합니다. [study8](./study8.md)에서 폴더 구조, 공통 모듈(composable), `.env` 환경변수 분리로 코드를 정돈합니다.
