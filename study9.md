# study9 — 테스트·디버깅

> 🎯 **목표**: Vue DevTools·브라우저 도구로 문제를 추적하고, **Vitest + Vue Test Utils**로 스토어와 컴포넌트에 자동화 테스트를 추가한다.

- 이전: [study8](./study8.md) 구조화
- 구현 위치: `demo/` 17개(`src/**/__tests__/*.spec.js`), `project/` 94개(`src/**/*.spec.ts`). 실행: `npm run test:run`
- 구현 메모: `project/` 는 `fetch` 를 직접 가짜로 바꾸는 대신 **MSW(`src/mocks/server.ts`)** 로 네트워크를 가로챕니다(study15). `demo/` 의 `auth` 스토어 테스트가 `vi.stubGlobal('fetch')` 방식입니다.

---

## 📖 이론

### 9.1 무엇을 어떻게 테스트하는가

| 종류 | 대상 | 이 단계에서 쓰는 도구 |
|---|---|---|
| 단위(Unit) | 함수, composable, Pinia 스토어 | Vitest |
| 컴포넌트 | props 입력 → 화면 출력, 클릭 → emit | Vitest + `@vue/test-utils` |
| 통합 / E2E | 여러 화면·실제 브라우저 | [study15](./study15.md)에서 |

좋은 테스트 기준: **구현이 아니라 동작(결과)을 검증**한다. "클릭하면 `toggle-favorite`가 한 번 발생한다"는 좋고, "내부 변수 `x`가 1이다"는 깨지기 쉽다.

### 9.2 테스트 구조 — Arrange / Act / Assert

```js
it('설명', async () => {
  // Arrange: 준비 (props, mock)
  // Act: 실행 (클릭, 함수 호출)
  // Assert: 검증 (expect)
})
```

### 9.3 Mock — 진짜 네트워크를 쓰지 않는다

테스트는 **빠르고 항상 같은 결과**여야 하므로 `fetch`를 가짜로 바꿉니다 (`vi.stubGlobal`, `vi.fn`).

### 9.4 디버깅 도구

| 도구 | 용도 |
|---|---|
| **Vue DevTools** (Components) | 컴포넌트 트리, props, `ref`/`computed` 값을 실시간 확인·수정 |
| Vue DevTools (Pinia) | 스토어 state 확인, 액션 호출 이력, 시간 여행 |
| Vue DevTools (Routes) | 현재 라우트·params·query |
| 브라우저 **Network** 탭 | 요청 URL·상태 코드·응답 본문·헤더(`Authorization`) |
| 브라우저 **Console** | `[Vue warn]` 경고, 예외 스택 |
| Sources 탭 + `debugger` | 중단점 걸고 한 줄씩 실행 |
| `console.log` / `console.table` | 간단 확인. 배포 전 제거 |

`project/`는 `vite-plugin-vue-devtools`가 이미 설치되어 있어 dev 서버 화면 하단 아이콘으로 DevTools를 엽니다.

---

## 🛠️ 실기

### 실습 1. Vitest 설치와 설정

```bash
cd project
npm install -D vitest @vue/test-utils jsdom
```

```js
// vite.config.js  (기존 설정에 test 항목 추가)
import { defineConfig } from 'vitest/config'   // 'vite' 대신 — test 타입이 포함됨

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',      // 브라우저 DOM 흉내
    globals: true,             // describe/it/expect 전역 사용
    restoreMocks: true,        // 테스트마다 mock 초기화
  },
})
```

```json
// package.json scripts
"test": "vitest",
"test:run": "vitest run"
```

| 줄 | 설명 |
|---|---|
| `vitest/config`의 `defineConfig` | Vite 설정에 `test` 키를 타입 오류 없이 쓰기 위함 |
| `environment: 'jsdom'` | Node에서 `document`, `localStorage` 등이 동작하게 함 |
| `npm run test` | 감시 모드(파일 저장 시 재실행). CI에서는 `test:run` |

### 실습 2. Pinia 스토어 테스트 — 즐겨찾기

```js
// src/stores/__tests__/favorites.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from '../favorites.js'

describe('favorites store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())      // 테스트마다 새 Pinia → 상태 격리
  })

  it('toggle하면 즐겨찾기에 추가되고, 다시 toggle하면 제거된다', () => {
    const store = useFavoritesStore()

    store.toggle(3)
    expect(store.isFavorite(3)).toBe(true)

    store.toggle(3)
    expect(store.isFavorite(3)).toBe(false)
  })
})
```

| 줄 | 설명 |
|---|---|
| `setActivePinia(createPinia())` | 컴포넌트 없이 스토어를 쓰기 위한 준비. `beforeEach`로 테스트마다 초기화 |
| `store.toggle(3)` → `isFavorite(3)` | 동작 → 결과 확인 |

### 실습 3. 로그인 스토어 + `fetch` mock

`authStore.login`이 성공/실패에 따라 상태를 바르게 바꾸는지 확인합니다 (study7의 실제 로그인 버전 기준).

```js
// src/stores/__tests__/auth.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth.js'

function mockFetchOnce(status, body) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }))
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('로그인에 성공하면 user와 token이 채워진다', async () => {
    mockFetchOnce(200, { data: { user: { id: 3, nickname: 'mina' }, accessToken: 'tkn' } })
    const auth = useAuthStore()

    const ok = await auth.login({ email: 'mina@example.com', password: 'password123' })

    expect(ok).toBe(true)
    expect(auth.isLoggedIn).toBe(true)
    expect(localStorage.getItem('mini-board:token')).toBe('tkn')
  })

  it('INVALID_CREDENTIALS면 안내 문구를 보여주고 로그인되지 않는다', async () => {
    mockFetchOnce(401, { error: { code: 'INVALID_CREDENTIALS', message: 'x' } })
    const auth = useAuthStore()

    const ok = await auth.login({ email: 'a@b.com', password: 'wrongpass' })

    expect(ok).toBe(false)
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.errorMessage).toContain('올바르지 않습니다')
  })
})
```

| 줄 | 설명 |
|---|---|
| `vi.stubGlobal('fetch', vi.fn()...)` | 전역 `fetch`를 가짜로 교체. 진짜 서버가 필요 없다 |
| `mockResolvedValue({ ok, status, json })` | 응답 객체의 모양만 흉내 |
| `localStorage.clear()` | 테스트 간 저장소 오염 방지 (jsdom이 `localStorage` 제공) |
| `expect(...).toContain(...)` | 문구 전체가 아니라 핵심 단어만 검증해 깨지기 쉬움을 줄임 |

### 실습 4. 컴포넌트 테스트 — `PostCard`

```js
// src/components/__tests__/PostCard.spec.js
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import PostCard from '../PostCard.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/posts/:id', component: { template: '<div />' } }],
})

function factory(props = {}) {
  return mount(PostCard, {
    props: { post: { id: 1, title: '첫 글' }, isFavorite: false, ...props },
    global: { plugins: [router] },          // <RouterLink> 사용을 위해 필요
  })
}

describe('PostCard', () => {
  it('제목을 표시한다', () => {
    expect(factory().text()).toContain('첫 글')
  })

  it('즐겨찾기 상태에 따라 별 모양이 바뀐다', () => {
    expect(factory({ isFavorite: false }).text()).toContain('☆')
    expect(factory({ isFavorite: true }).text()).toContain('★')
  })

  it('별 버튼 클릭 시 toggle-favorite 이벤트를 한 번 발생시킨다', async () => {
    const wrapper = factory()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('toggle-favorite')).toHaveLength(1)
  })
})
```

| 줄 | 설명 |
|---|---|
| `mount(Component, { props, global })` | 컴포넌트를 실제로 렌더링 |
| `global.plugins: [router]` | `PostCard` 안의 `<RouterLink>`가 동작하도록 테스트용 라우터 제공 (`createMemoryHistory`) |
| `factory(props)` | 반복되는 마운트 코드를 함수로 — 필요한 props만 덮어쓰기 |
| `await wrapper.get('button').trigger('click')` | 클릭 후 DOM 갱신을 기다린다 (`await` 필수) |
| `wrapper.emitted('toggle-favorite')` | 자식이 `emit`한 이벤트 기록 |

### 실습 5. composable·순수 함수 테스트 (가장 쉬움)

```js
// src/utils/__tests__/format.spec.js
import { formatDate } from '../format.js'

it('ISO 문자열을 사람이 읽을 수 있는 형태로 바꾼다', () => {
  expect(formatDate('2026-11-01T09:00:00Z')).toMatch(/2026/)
})
```

### 실습 6. DevTools로 디버깅 연습

1. 검색창에 글자를 입력하며 **Components 탭 → `PostListView` → `keyword`** 값이 따라 바뀌는지 본다.
2. Pinia 탭에서 로그인 전/후의 `auth` state 비교.
3. Network 탭에서 `Authorization: Bearer ...` 헤더가 붙는지 확인.
4. 일부러 `fetch` 주소를 틀리게 바꿔 Console의 오류 → Network의 404를 따라가 원인을 찾는다.
5. 의심 가는 줄에 `debugger` 한 줄을 넣고 Sources 탭에서 변수 값을 확인한다.

### 실행 확인

```bash
npm run test:run
```

기대 결과: 모든 테스트 통과(녹색). 일부러 `store.toggle`을 망가뜨려 **테스트가 실패하는 것**도 확인합니다(테스트가 정말 검증하고 있다는 증거).

---

## ⚠️ 오류 노트 — 자주 나는 오류

### 테스트 환경

| 증상 | 원인 | 해결 |
|---|---|---|
| `instanceof DOMException` 이 jsdom 에서 거짓 (취소 오류를 못 알아봄) | jsdom 과 Node(undici)의 `DOMException` 클래스가 달라 `instanceof` 가 실패 | `err.name === 'AbortError'` 로 판별 (`project/src/api/abort.ts`) |
| `Failed to parse URL from /api/...` (테스트에서 상대 경로 fetch) | Node 의 `fetch` 는 기준 주소가 없다 | 테스트 설정 `test.env.VITE_API_BASE_URL` 에 절대 주소를 준다 |
| `document is not defined` | `environment: 'jsdom'` 미설정 | 설정 추가, `jsdom` 설치 |
| `describe is not defined` | `globals: true` 없음 | 설정하거나 `import { describe, it, expect } from 'vitest'` |
| `getActivePinia() was called but there was no active Pinia` | 테스트에서 `setActivePinia` 누락 | `beforeEach`에서 호출 |
| `Failed to resolve component: RouterLink` (경고) | 라우터 미제공 | `global.plugins: [router]` 또는 `global.stubs: { RouterLink: true }` |
| 클릭 후 `expect`가 이전 DOM을 봄 | `await` 누락 | `await trigger(...)`, 비동기 후에는 `await flushPromises()` |
| 테스트끼리 영향 | 상태·mock 공유 | `beforeEach` 초기화, `restoreMocks: true` |
| `localStorage is not defined` | jsdom 아닌 환경 | jsdom 환경 확인 |

### 실행 중 오류 (런타임)

| 메시지 / 증상 | 원인 | 해결 |
|---|---|---|
| `Cannot read properties of undefined (reading 'xxx')` | 데이터가 오기 전에 중첩 속성 접근 (`post.author.nickname`) | `v-if="post"`로 감싸거나 `post?.author?.nickname` |
| `[Vue warn]: Property "x" was accessed during render but is not defined` | 선언 안 한 변수/오타 | 변수 선언 확인 |
| 값이 바뀌었는데 화면이 그대로 | `.value` 누락, `reactive` 구조분해, 일반 변수 사용 | [study3](./study3.md) 오류 노트 |
| `[Vue warn]: Duplicate keys found during update` | `v-for`의 `:key` 중복 | 고유 값 사용 |
| `Uncaught (in promise) ...` | `await` 하는 함수에 `try/catch` 없음 | `try/catch` 또는 `.catch` |
| `blocked by CORS policy` | 다른 출처 요청을 서버가 허용 안 함 | Vite 프록시 / 서버 CORS ([study6](./study6.md)) |
| `[Vue warn]: Hydration ...` | (SSR 사용 시) 서버·클라이언트 HTML 불일치 | 이 저장소는 SPA라 해당 없음 |
| 라우트가 없다는 경고 `No match found for location` | 경로 오타 | 라우트 정의 확인 |

---

## ☐ 체크리스트

- ☑ 브라우저 Console / Network 탭으로 오류와 요청을 확인 (study6 실행 확인에서 사용)
- ☐ Vue DevTools(Components, Pinia, Routes)로 상태를 직접 확인
- ☑ **Vitest 설치·설정** (`environment: 'jsdom'`, `test`/`test:run` 스크립트) — Notion 체크 항목 — `demo/`, `project/` 모두 (`vitest/config` 의 `defineConfig`)
- ☑ 스토어 테스트 2개 이상 (favorites, auth) — `project/src/stores/{auth,favorites}.spec.ts`, `demo/src/stores/__tests__/auth.spec.js`
- ☑ 컴포넌트 테스트 (`PostCard`의 표시·emit) — `PostCard`·`Pagination`·`StateMessage`·`FormField`·`ErrorBoundary`
- ☑ `fetch`를 `vi.stubGlobal`로 mock해서 성공·실패 케이스 검증 — `demo` 의 auth 스토어 테스트
- ☐ 일부러 코드를 망가뜨려 테스트가 **실패**하는 것을 확인
- ☐ "구현이 아니라 동작을 검증한다"를 예시와 함께 설명할 수 있다

## ➡️ 다음 단계 연결

테스트까지 갖췄으니 이제 **세상에 내놓는** 단계입니다. [study10](./study10.md)에서 빌드·배포하고 기초 구간을 총정리합니다.
