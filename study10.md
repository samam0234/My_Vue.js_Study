# study10 — 배포·정리 (기초 구간 마무리)

> 🎯 **목표**: 프로젝트를 빌드해 정적 파일로 배포할 수 있게 만들고, study0~10 전체를 복습 문제로 정리한다.

- 이전: [study9](./study9.md) 테스트·디버깅
- 다음: [midpoint](./midpoint.md) — study0~10만으로 게시판+로그인 완성
- 구현 위치: `demo/`·`project/` 의 `public/_redirects`, `vercel.json`, `vite.config` 의 `base`(`BASE_PATH`)

---

## 📖 이론

### 10.1 개발 서버 vs 빌드 결과

| | `npm run dev` | `npm run build` |
|---|---|---|
| 목적 | 개발 중 빠른 확인 (HMR) | 배포용 최적화 결과물 |
| 결과 | 메모리상 (파일 없음) | `dist/` 폴더 (정적 파일) |
| 코드 | 변환만, 최적화 없음 | 번들링·압축·해시 파일명·코드 분할 |

Vue 앱(SPA)의 빌드 결과는 **HTML + JS + CSS 정적 파일**뿐이라 Node 서버가 필요 없고, 정적 파일을 서빙하는 어떤 곳에든 올릴 수 있습니다.

### 10.2 `dist/` 구조

```
dist/
├─ index.html
├─ favicon.ico
└─ assets/
   ├─ index-3f9a1c.js        # 메인 번들 (파일명에 내용 해시 → 캐시 갱신 자동)
   ├─ PostListView-a1b2c3.js # 라우트별 지연 로딩 청크
   └─ index-9d8e7f.css
```

### 10.3 배포 시 꼭 알아야 하는 3가지

1. **SPA fallback**: `createWebHistory`를 쓰면 `/posts/3`으로 직접 접속(또는 새로고침) 시 서버는 그런 **파일이 없어서 404**를 냅니다. 서버가 모든 경로를 `index.html`로 돌려주도록 설정해야 합니다.
2. **base 경로**: 사이트가 `https://example.com/`이 아니라 `https://example.com/mini-board/`처럼 **하위 경로**에 올라가면 `vite.config.js`의 `base: '/mini-board/'`가 필요합니다.
3. **환경변수는 빌드 시점**: `VITE_API_BASE_URL`은 빌드할 때 코드에 박힙니다 ([study8](./study8.md)).

### 10.4 배포 위치 선택지 (정적 호스팅)

| 방식 | 특징 |
|---|---|
| Vercel / Netlify | Git 연결로 자동 빌드·배포, SPA fallback 설정 간단 |
| GitHub Pages | `base` 설정 필요. History 모드 새로고침 404 → `404.html` 트릭 또는 hash 모드 |
| 직접 서버(Nginx) | `try_files`로 fallback 설정 ([study17](./study17.md)에서 Docker로 묶음) |

---

## 🛠️ 실기

### 실습 1. 빌드와 로컬 확인

```bash
cd project
npm run build      # dist/ 생성
npm run preview    # dist/를 로컬 서버로 띄워 확인 (기본 http://localhost:4173)
```

| 명령 | 설명 |
|---|---|
| `vite build` | 번들링·압축. 터미널에 파일별 크기가 출력된다 |
| `vite preview` | 빌드 결과를 서빙해 **운영과 가장 비슷한 상태**로 확인. 개발 서버와 다르므로 배포 전 꼭 한 번 |

확인할 것: `/posts/3`을 주소창에 직접 입력해 보면 `preview`에서는 열리지만, 단순 정적 서버(`npx serve dist` 등)에서는 404가 날 수 있습니다 → 이것이 SPA fallback 문제입니다.

### 실습 2. SPA fallback 설정

**Netlify** — `public/_redirects` (빌드 시 `dist/`로 복사됨):

```
/*    /index.html   200
```

**Vercel** — `vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Nginx**:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

| 줄 | 설명 |
|---|---|
| `$uri` → `$uri/` → `/index.html` | 실제 파일이 있으면 그것을, 없으면 `index.html`을 준다. 이후 Vue Router가 URL을 보고 화면을 결정 |
| Netlify `200` | 리다이렉트가 아니라 **내용을 바꿔 서빙**(주소는 유지) |

### 실습 3. 하위 경로 배포 (`base`)

```js
// vite.config.js
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // ...
})
```

```bash
BASE_PATH=/mini-board/ npm run build      # Windows PowerShell: $env:BASE_PATH='/mini-board/'; npm run build
```

라우터가 `createWebHistory(import.meta.env.BASE_URL)`을 쓰고 있으므로 `base`가 자동으로 반영됩니다.

### 실습 4. 정적 호스팅에 올리기 (예: Vercel / Netlify 연결)

1. Git 저장소를 호스팅 서비스에 연결하고 **Root Directory**를 `project`로 지정
2. Build Command: `npm run build`, Output Directory: `dist`
3. 환경 변수에 `VITE_API_BASE_URL` 등록 (빌드 때 주입)
4. 배포 후 `/posts/1` 직접 접속과 새로고침이 되는지 확인
5. 백엔드가 있다면 서버의 `CORS_ORIGIN`에 배포 주소를 추가

### 실습 5. 배포 전 점검표

- ☑ `npm run build`가 오류 없이 끝난다 — `demo`, `project` 모두 확인
- ☑ `npm run preview`에서 모든 화면과 새로고침 동작 확인 — Playwright E2E(운영 빌드 대상) 19개로 확인
- ☑ `console.log`, `debugger`, 테스트용 계정 채우기 버튼 제거 — `project` 는 `VITE_ENABLE_MOCK` 로 운영 번들에서 제거, `grep` 으로 `dist/` 확인
- ☑ `.env.production`에 비밀키가 **없다**
- ☑ 로그인·API 오류 시 화면이 깨지지 않는다 — 단위·통합·E2E 테스트로 확인
- ☑ `npm run test:run` 통과 — `demo` 17개, `project` 94개

---

## 📋 기초 구간 총정리 (study0~10)

| 문서 | 핵심 한 줄 |
|---|---|
| study0 | Node + `npm create vue` + Vite로 프로젝트를 만든다. SFC 3블록, `main.js` |
| study1 | `{{ }}`, `v-bind`, `v-on`, `v-for`+`:key`, `v-if` vs `v-show`, `v-model` |
| study2 | 컴포넌트: `props` 내려주고 `emit` 올린다. 자식은 props를 바꾸지 않는다 |
| study3 | `ref`(.value) / `reactive` / `computed`(파생) / `watch`(부수 작용) / `onMounted` |
| study4 | Router: URL → 화면. `params`, `useRoute`(읽기) vs `useRouter`(이동), 지연 로딩 |
| study5 | `v-model` + `computed` 오류 객체 + `touched`/`submitted`, 서버 `fields` 오류 |
| study6 | `fetch` + `res.ok` + loading/error/success, API 클라이언트, 프록시, CRUD |
| study7 | Pinia, `accessToken`, 새로고침 유지, 라우트 가드, 401/403 |
| study8 | 폴더 역할 분리, composable, `.env`(`VITE_`), 비밀키 금지 |
| study9 | Vitest(스토어·컴포넌트), mock, DevTools, 자주 나는 오류 |
| study10 | `build`/`preview`, SPA fallback, `base`, 환경변수는 빌드 시점 |

### 한 장 요약 — 데이터가 흐르는 길

```
사용자 입력 ──v-model──▶ 폼 상태(reactive) ──검증(computed)──▶ 오류 표시
        │ 제출(@submit.prevent)
        ▼
   API 모듈(api/*.js) ── fetch + Bearer 토큰 ──▶ 서버 ──▶ JSON
        │ 성공: 상태 갱신(ref/Pinia) → 화면 자동 갱신
        └ 실패: ApiError → 401 로그인 화면 / 403 안내 / 400 필드 오류
```

---

## ❓ 복습 문제 (정답은 아래)

1. `v-if`와 `v-show`의 차이를 DOM 관점에서 설명하세요.
2. `ref`를 스크립트에서는 `.value`로 쓰는데 템플릿에서는 왜 생략하나요?
3. `const { email } = reactive({ email: '' })` 후 `email`을 바꿔도 화면이 안 바뀌는 이유와 해결법은?
4. 자식 컴포넌트가 `props.count++`를 하면 안 되는 이유와 올바른 방법은?
5. 상세 화면에서 `/posts/1`→`/posts/2`로 이동했는데 내용이 안 바뀝니다. 원인과 해결은?
6. `computed`와 `watch`는 각각 언제 쓰나요?
7. `fetch`가 `404`를 받았는데 `catch`로 가지 않는 이유는?
8. 로그인 후 새로고침하면 로그아웃됩니다. 왜 그렇고 어떻게 해결하나요? 이 방법의 보안 위험은?
9. 401과 403은 화면에서 각각 어떻게 처리해야 하나요?
10. `VITE_` 접두어가 없는 환경변수는 코드에서 왜 `undefined`인가요? 비밀키를 `VITE_`로 두면 안 되는 이유는?
11. 배포한 사이트에서 `/posts/3`을 새로고침하면 404가 납니다. 원인과 해결은?
12. `.env.production`의 `VITE_API_BASE_URL`을 배포 서버에서 바꿨는데 반영이 안 됩니다. 왜일까요?

### 정답

1. `v-if`: 조건이 거짓이면 DOM에서 **제거**(생성·삭제 비용). `v-show`: DOM은 두고 `display: none`만 토글.
2. 템플릿에서는 Vue가 ref를 자동으로 풀어 준다(자동 언랩). 스크립트에서는 일반 객체이므로 `.value` 필요.
3. 구조분해는 값을 **복사**해 반응성 연결이 끊긴다. `toRefs(obj)` 또는 처음부터 `ref` 사용.
4. 단방향 흐름이 깨져 변경 추적이 어렵다. `emit('increment')`로 부모에게 알리고 부모가 값을 바꾼다.
5. 같은 라우트라 컴포넌트가 **재사용**되어 `onMounted`가 안 불린다. `watch(() => route.params.id, ...)`.
6. `computed`: 다른 값에서 **파생된 값**(캐시). `watch`: 값이 바뀔 때 **부수 작용**(fetch, 저장, 로그).
7. `fetch`는 네트워크 실패만 reject한다. HTTP 오류는 `res.ok`가 `false`로 올 뿐이므로 직접 확인해 `throw`.
8. 토큰이 메모리(Pinia)에만 있어서. `localStorage`에 저장하고 시작 시 `/api/auth/me`로 복원. 위험: XSS 시 JS로 토큰 탈취 가능(httpOnly 쿠키는 대안).
9. 401: 토큰 폐기 후 로그인 화면(원래 주소 `redirect` 기억). 403: 로그인은 되어 있으므로 현재 화면에 권한 없음 안내.
10. 보안상 `VITE_` 접두어가 있는 것만 클라이언트 번들에 노출하도록 Vite가 제한한다. `VITE_` 값은 **브라우저에서 누구나 볼 수 있어** 비밀이 될 수 없다.
11. 서버가 `/posts/3`을 파일로 찾아 404. 모든 경로를 `index.html`로 fallback(`try_files`, `_redirects`, `rewrites`).
12. 환경변수는 **빌드 시점**에 번들에 박힌다. 다시 빌드해야 한다(또는 런타임 설정 파일 방식 사용).

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 배포 후 새로고침하면 404 | SPA fallback 없음 | 실습 2 |
| 배포 후 화면은 뜨는데 CSS/JS 404 | `base` 불일치 (하위 경로 배포) | `base` 설정 후 재빌드 |
| 배포 후 API 호출이 로컬 주소로 감 | `.env.production` 누락/잘못된 빌드 환경 변수 | 빌드 환경에 `VITE_API_BASE_URL` 설정 후 재빌드 |
| 배포 후 CORS 오류 | 서버 `CORS_ORIGIN`에 배포 주소 없음 | 서버 설정에 추가 (프록시는 운영에 없다) |
| `npm run build`에서 `Failed to resolve import` | 대소문자 파일명 불일치 (Windows는 통과, Linux 빌드에서 실패) | 실제 파일명과 import 대소문자 일치 |
| 빌드 경고 `Some chunks are larger than 500 kB` | 번들이 큼 | [study12](./study12.md) 최적화 |

---

## ☐ 체크리스트

- ☑ 기초 구간 개념(study0~7)을 `demo/`·`project/`에서 직접 실습
- ☑ `npm run build` → `dist/` 구조 확인
- ☑ `npm run preview`로 운영과 유사하게 확인
- ☑ SPA fallback을 한 가지 방법(Netlify/Vercel/Nginx)으로 설정 — `demo/`·`project/` 의 `public/_redirects`, `vercel.json`, `project/nginx/`
- ☐ 정적 호스팅에 배포하고 `/posts/1` 새로고침 동작 확인
- ☑ 배포 전 점검표 6개 항목 통과
- ☐ 복습 문제 12개를 정답을 보지 않고 설명

## ➡️ 다음 단계 연결

기초 구간 끝. [midpoint](./midpoint.md)에서 **지금까지 배운 것만으로** 게시판 + 로그인 서비스를 처음부터 끝까지 완성합니다.
