# study15 — 고급 테스트·CI

> 🎯 **목표**: 단위·통합·E2E 테스트를 역할에 맞게 나눠 작성하고, GitHub Actions로 push마다 자동 실행(CI)한다.

- 이전: [study14](./study14.md) 타입·정적 분석
- 기초 테스트는 [study9](./study9.md) — 여기서는 그 위에 **통합·E2E·커버리지·CI**를 쌓는다.
- 구현 위치: [`project/src/**/*.spec.ts`](./project/src), [`project/src/mocks/`](./project/src/mocks)(MSW 핸들러·메모리 DB), [`project/e2e/board.spec.ts`](./project/e2e/board.spec.ts), [`project/playwright.config.ts`](./project/playwright.config.ts), [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
- 실측: 단위·통합 94개 통과(분기 커버리지 약 81%), E2E 19개 통과(약 13초). 구현 메모: 이 저장소의 E2E 는 `page.route` 대신 **MSW 목 서버를 켠 빌드(`vite build --mode e2e`)** 를 대상으로 해서 단위·통합·E2E 가 같은 가짜 서버(`handlers.ts`)를 공유합니다.

---

## 📖 이론

### 15.1 테스트 피라미드

```
        ▲ 적게        E2E  (실제 브라우저, 전체 흐름) — 느리고 비싸지만 "진짜 동작" 보증
       ╱ ╲
      ╱통합╲          통합 (여러 컴포넌트 + 스토어 + 라우터 + 가짜 API)
     ╱─────╲
    ╱ 단위   ╲        단위 (함수, 스토어, 컴포넌트 하나) — 빠르고 많이
   ╱─────────╲ 많이
```

| 종류 | 도구 | 속도 | 잡는 버그 |
|---|---|---|---|
| 단위 | Vitest | 매우 빠름 | 로직 오류 |
| 통합 | Vitest + Test Utils + **MSW** | 빠름 | 화면 ↔ 스토어 ↔ API 연결 오류 |
| E2E | **Playwright** | 느림 | 라우팅·빌드·실제 브라우저 문제 |

### 15.2 MSW (Mock Service Worker)

`fetch`를 직접 가짜로 바꾸는(study9) 대신, **네트워크 요청 자체를 가로채** 가짜 서버처럼 응답합니다. 앱 코드는 진짜 `fetch`를 그대로 쓰므로 실제와 더 가깝습니다. 같은 핸들러를 통합 테스트와 개발 서버(서버 없이 화면 개발)에서 함께 쓸 수 있습니다.

### 15.3 CI (Continuous Integration)

코드를 push/PR 할 때마다 **자동으로** 설치 → 린트 → 타입 검사 → 테스트 → 빌드를 실행해, "내 컴퓨터에선 됐는데"를 없앱니다. 실패하면 병합을 막을 수 있습니다.

---

## 🛠️ 실기

### 실습 1. 커버리지

```bash
npm install -D @vitest/coverage-v8
```

```js
// vite.config.js 의 test 안
test: {
  environment: 'jsdom',
  globals: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/**/*.{js,ts,vue}'],
    exclude: ['src/main.*', 'src/**/*.d.ts', 'src/**/__tests__/**'],
  },
},
```

```json
"test:coverage": "vitest run --coverage"
```

커버리지 숫자는 **빠진 곳을 찾는 지도**이지 목표 자체가 아닙니다(100%여도 검증이 없을 수 있다). `coverage/index.html`에서 빨간 줄(실행되지 않은 분기)을 보고 중요한 분기부터 테스트합니다.

### 실습 2. MSW로 통합 테스트

```bash
npm install -D msw
```

```js
// src/test/server.js
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/posts', () =>
    HttpResponse.json({
      data: [{ id: 1, title: '첫 글', author: { id: 3, nickname: 'mina' }, commentCount: 0, createdAt: '2026-11-01T09:00:00Z' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    }),
  ),
  http.post('*/api/auth/login', async ({ request }) => {
    const { password } = await request.json()
    if (password !== 'password123') {
      return HttpResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: '로그인 실패' } },
        { status: 401 },
      )
    }
    return HttpResponse.json({ data: { user: { id: 3, email: 'mina@example.com', nickname: 'mina' }, accessToken: 'tkn' } })
  }),
]

export const server = setupServer(...handlers)
```

```js
// src/test/setup.js  — vitest 설정의 setupFiles 에 등록
import { server } from './server.js'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))  // 정의 안 한 요청은 오류
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

```js
// vite.config.js test 안
setupFiles: ['./src/test/setup.js'],
```

통합 테스트 — 목록 화면 전체(라우터 + Pinia + 컴포넌트 + API):

```js
// src/views/__tests__/PostListView.spec.js
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import PostListView from '../PostListView.vue'
import { server } from '@/test/server.js'
import { http, HttpResponse } from 'msw'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: PostListView }, { path: '/posts/:id', component: { template: '<div/>' } }],
})

function mountView() {
  return mount(PostListView, { global: { plugins: [createPinia(), router] } })
}

describe('PostListView (통합)', () => {
  it('API에서 받은 게시글을 표시한다', async () => {
    const wrapper = mountView()
    await flushPromises()                       // 비동기 요청·갱신이 끝날 때까지 대기
    expect(wrapper.text()).toContain('첫 글')
  })

  it('서버 오류가 나면 오류 메시지와 다시 시도 버튼을 보여준다', async () => {
    server.use(http.get('*/api/posts', () =>
      HttpResponse.json({ error: { code: 'INTERNAL', message: '서버 오류' } }, { status: 500 })))
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('서버 오류')
    expect(wrapper.find('button').text()).toContain('다시')
  })
})
```

| 줄 | 설명 |
|---|---|
| `onUnhandledFrame: 'error'` | 테스트가 예상치 못한 요청을 하면 실패 → 숨은 네트워크 호출 발견 (MSW 2 까지는 `onUnhandledRequest`) |
| `server.use(...)` | 특정 테스트에서만 핸들러를 덮어써 **오류 시나리오** 재현 |
| `flushPromises()` | 대기 중인 Promise(fetch, 렌더)를 모두 처리 |
| `afterEach(resetHandlers)` | 덮어쓴 핸들러가 다음 테스트로 새지 않게 |

### 실습 3. E2E — Playwright

```bash
npm init playwright@latest        # 설정 마법사: tests 폴더, GitHub Actions 파일 생성 여부 등
```

```js
// playwright.config.js (요점)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',   // 운영 빌드로 테스트
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

```js
// e2e/auth.spec.js
import { test, expect } from '@playwright/test'

test('비로그인 사용자가 글쓰기에 접근하면 로그인 화면으로 이동하고, 로그인 후 돌아온다', async ({ page }) => {
  // 백엔드를 띄우지 않고 네트워크를 가로채 응답을 만든다 (E2E지만 서버 의존을 낮춤)
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ json: { data: { user: { id: 3, email: 'mina@example.com', nickname: 'mina' }, accessToken: 'tkn' } } }))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { data: { id: 3, email: 'mina@example.com', nickname: 'mina' } } }))

  await page.goto('/posts/new')
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await page.getByLabel('이메일').fill('mina@example.com')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page).toHaveURL(/\/posts\/new/)
})

test('새로고침해도 로그인이 유지된다', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mini-board:token', 'tkn'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { data: { id: 3, email: 'mina@example.com', nickname: 'mina' } } }))

  await page.goto('/')
  await expect(page.getByText('mina')).toBeVisible()
  await page.reload()
  await expect(page.getByText('mina')).toBeVisible()
})
```

| 줄 | 설명 |
|---|---|
| `webServer.command` | 테스트 전에 **운영 빌드**를 띄움 — SPA fallback·번들 문제까지 검증 |
| `page.route(...)` | 브라우저 레벨 네트워크 가로채기. 실제 백엔드 없이도 흐름 검증 가능 |
| `getByLabel` / `getByRole` | **사용자가 보는 방식**으로 요소 선택 (CSS 클래스보다 안정적, [study5](./study5.md)의 `label for`가 여기서 쓸모) |
| `toHaveURL`, `toBeVisible` | 자동 재시도(auto-wait)하는 단언 — 임의의 `sleep` 불필요 |

실제 백엔드를 띄운 **진짜 E2E**는 별도 스위트(`e2e/real/`)로 분리해 배포 전에만 돌리는 방식이 흔합니다.

### 실습 4. 테스트 스크립트 정리

```json
"scripts": {
  "lint": "eslint .",
  "type-check": "vue-tsc --noEmit",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "ci": "npm run lint && npm run type-check && npm run test:run && npm run build"
}
```

### 실습 5. GitHub Actions — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: project           # 저장소 루트가 아니라 project/ 에서 실행
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: project/package-lock.json

      - run: npm ci                          # lock 파일 기준으로 정확히 설치
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - run: npm run build

      - uses: actions/upload-artifact@v4     # 커버리지 보고서 보관
        with:
          name: coverage
          path: project/coverage

  e2e:
    runs-on: ubuntu-latest
    needs: check                              # check가 성공해야 실행
    defaults:
      run:
        working-directory: project
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: project/package-lock.json }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()                         # 실패했을 때만 리포트 업로드
        with:
          name: playwright-report
          path: project/playwright-report
```

| 줄 | 설명 |
|---|---|
| `on.push.branches` / `pull_request` | master push와 모든 PR에서 실행 |
| `working-directory: project` | 이 저장소는 루트가 아니라 하위 폴더가 앱 |
| Node 22 | `package.json`의 `engines`(^22.18) 요구에 맞춤 |
| `npm ci` | `package-lock.json`대로 재현 가능한 설치 (`npm install`은 lock을 바꿀 수 있음) |
| `cache: npm` | 의존성 캐시로 실행 시간 단축 |
| `needs: check` | 느린 E2E는 빠른 검사가 통과한 뒤에만 |
| `if: failure()` | 실패 시 Playwright 리포트·트레이스를 받아 원인 분석 |

> Node 버전, 액션 버전(`@v4` 등)은 시간이 지나면 바뀝니다. 작성 시점의 공식 문서로 확인하세요.

**보호 규칙(선택)**: GitHub → Settings → Branches에서 `check` 통과를 병합 조건으로 지정.

### 실행 확인

1. 로컬: `npm run ci` 한 번에 통과
2. `npm run test:coverage` 후 `coverage/index.html`에서 빠진 분기를 확인하고 테스트 1개 추가
3. `npm run test:e2e` → 브라우저 흐름이 통과, `npx playwright show-report`로 리포트 확인
4. 브랜치에서 일부러 테스트를 깨뜨려 push → Actions가 **빨간 X**로 막는지 → 고쳐서 초록으로
5. Actions 로그에서 각 단계 시간 확인

---

## ⚠️ 오류 노트

> 실제로 겪은 함정 3가지: ① **jsdom 에서 `err instanceof DOMException` 이 거짓**이다(Node 의 fetch 가 던지는 `DOMException` 과 jsdom 의 것이 다른 클래스) → `err.name === 'AbortError'` 로 판별. ② 통합 테스트에서 `flushPromises()` 만으로는 MSW 응답(타이머)을 못 기다린다 → 짧게 쉬며 반복하는 `settle()` 헬퍼, 그리고 테스트 모드에서는 목 서버 지연을 0 으로. ③ Playwright `getByLabel('제목')` 은 부분 일치라 `제목·본문 검색` 입력까지 잡는다 → `{ exact: true }` 와 화면 전환 대기.

| 증상 | 원인 | 해결 |
|---|---|---|
| MSW: `[MSW] Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest"` | 핸들러에 없는 요청 발생 | 핸들러 추가 (의도한 요청인지도 점검) |
| 통합 테스트에서 값이 안 보임 | 비동기 완료 전에 단언 | `await flushPromises()` |
| `msw`가 상대경로 `fetch('/api/...')`를 못 잡음 (jsdom/Node) | Node 환경은 기준 URL이 없음 | 핸들러를 `*/api/...` 와일드카드로, 또는 `baseURL` 설정 |
| 테스트끼리 영향 (상태·핸들러) | 정리 누락 | `afterEach(resetHandlers)`, 테스트마다 새 Pinia |
| Playwright: 로컬은 통과, CI는 실패 | 브라우저 미설치 / 타이밍 | `playwright install --with-deps`, `sleep` 대신 auto-wait 단언, 재시도 설정 |
| E2E가 가끔 실패(flaky) | 고정 대기, 외부 서버 의존 | 네트워크 가로채기, 안정적인 선택자(`getByRole`) |
| Actions: `npm ci` 실패 `package.json and package-lock.json are not in sync` | lock 파일 미갱신 | 로컬에서 `npm install` 후 lock 커밋 |
| Actions: `ENOENT package.json` | 작업 폴더 틀림 | `working-directory: project` |
| 커버리지가 낮은데도 통과 | 임계값 없음 | `coverage.thresholds`로 최소치 설정(점진적으로 올림) |
| CI가 너무 느림 | 매번 전체 E2E | PR에는 핵심 E2E만, 전체는 야간/배포 전 |

---

## ☐ 체크리스트

- ☐ 테스트 피라미드에서 단위/통합/E2E의 역할을 설명
- ☑ `@vitest/coverage-v8`로 커버리지를 보고 빠진 분기 1곳 보완 — `thresholds` 로 최소치 설정
- ☑ MSW로 API를 가로채 목록 화면 통합 테스트(성공 + 500 오류) — `views.spec.ts`
- ☑ Playwright E2E 2개 (로그인 리다이렉트, 새로고침 후 로그인 유지) — 19개 (로그인 리다이렉트, 새로고침 유지, CRUD, AI 스트리밍, 모바일 폭 등)
- ☑ `npm run ci`(lint → type-check → test → build) 스크립트
- ☐ `.github/workflows/ci.yml`로 push·PR마다 자동 실행 — 파일은 작성했고, push 후 GitHub Actions 탭에서 첫 실행을 확인한다
- ☐ CI 실패 → 수정 → 성공 사이클을 한 번 경험
- ☐ `npm ci`와 `npm install`의 차이를 설명

## ➡️ 다음 단계 연결

테스트가 "기능이 맞는가"를 보증했다면, [study16](./study16.md)은 "**안전하게 운영되는가**" — 보안 점검, 로깅, 모니터링, 에러 처리를 다룹니다.
