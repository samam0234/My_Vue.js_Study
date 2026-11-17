# study16 — 보안·운영 심화

> 🎯 **목표**: 프론트엔드 보안 점검(XSS·토큰·의존성·헤더·비밀 노출)과 운영에 필요한 **전역 에러 처리·로깅·모니터링**을 갖춘다.

- 이전: [study15](./study15.md) 고급 테스트·CI
- 구현 위치: `project/src/{main.ts,utils/report.ts,utils/safeUrl.ts,components/ErrorBoundary.vue}`, `project/nginx/security-headers.conf`, `.github/dependabot.yml`
- 점검 결과는 [final.md](./final.md) §3.2 에 기록했습니다. 모니터링은 Sentry 대신 의존성 없는 `sendBeacon` 보고(`VITE_ERROR_REPORT_URL`)로 구현했고, `reportError` 한 곳만 바꾸면 Sentry 로 교체됩니다.

---

## 📖 이론

### 16.1 프론트엔드 보안의 현실

브라우저 코드는 **사용자가 모두 볼 수 있고 수정할 수 있습니다.** 따라서

- 숨김 버튼·클라이언트 검증은 **보안이 아니라 UX** (서버가 항상 재검증).
- 비밀(API 시크릿, DB 비밀번호)은 프론트에 **둘 수 없다** ([study8](./study8.md) `VITE_`).
- 프론트가 지킬 수 있는 것: **XSS 방지**, **토큰 관리**, **안전한 의존성**, **보안 헤더**, **민감정보 로깅 금지**.

### 16.2 주요 위험과 Vue에서의 대응

| 위험 | 설명 | 대응 |
|---|---|---|
| **XSS** | 악성 스크립트가 페이지에서 실행 | `{{ }}` 보간은 **자동 이스케이프**. `v-html`·`innerHTML`에 사용자 입력을 넣지 않는다 |
| 토큰 탈취 | XSS가 있으면 `localStorage` 토큰 유출 | XSS 방지 + 짧은 만료, 또는 httpOnly 쿠키 ([study7](./study7.md)) |
| 위험한 링크 | `javascript:` URL을 `:href`에 바인딩 | 사용자 입력 URL은 `http(s)`만 허용 |
| 의존성 취약점 | 패키지의 알려진 취약점 | `npm audit`, 자동 업데이트(Dependabot), lock 고정 |
| 공급망 공격 | 악성 패키지·postinstall | 필요한 패키지만, 신뢰할 수 있는 것, `npm ci` |
| 비밀 노출 | `.env`·키를 번들/깃에 포함 | `VITE_`에 비밀 금지, `.env.local` 커밋 금지 |
| 클릭재킹 / 리소스 주입 | 다른 사이트가 내 사이트를 iframe 등으로 | `Content-Security-Policy`, `X-Frame-Options`(frame-ancestors) 헤더 |
| CSRF | 쿠키 인증 시 위조 요청 | Bearer 헤더 방식은 영향 적음, 쿠키는 `SameSite` + CSRF 토큰 |

### 16.3 운영의 세 축

| 축 | 질문 | 도구 |
|---|---|---|
| **에러 처리** | 오류가 나도 화면이 죽지 않고, 사용자에게 알맞게 안내하는가 | `errorHandler`, `onErrorCaptured`, 오류 경계 |
| **로깅** | 무슨 일이 있었는지 나중에 알 수 있는가 | 구조화된 로그, `requestId` |
| **모니터링** | 사용자가 겪는 오류를 **먼저** 아는가 | Sentry 등 오류 추적, 성능(Web Vitals) 수집 |

---

## 🛠️ 실기

### 실습 1. XSS 점검 — `v-html` 찾기

```bash
# 프로젝트에서 위험 지점 검색
grep -rn "v-html\|innerHTML\|insertAdjacentHTML" src/
```

```vue
<!-- ❌ 사용자가 쓴 글 본문을 그대로 HTML로 렌더링 -->
<div v-html="post.body"></div>

<!-- ✅ 기본: 텍스트로 출력 (자동 이스케이프). 줄바꿈만 보존 -->
<p class="whitespace-pre-wrap">{{ post.body }}</p>
```

마크다운·HTML 서식이 꼭 필요하면 **정화(sanitize) 라이브러리**를 거칩니다.

```bash
npm install dompurify
```

```js
import DOMPurify from 'dompurify'
const safeHtml = computed(() => DOMPurify.sanitize(renderedMarkdown.value))
```

```vue
<div v-html="safeHtml"></div>   <!-- 정화된 결과만 v-html 허용 -->
```

직접 확인: 글 본문에 `<img src=x onerror="alert(1)">`를 저장했을 때 `{{ }}` 출력은 **글자 그대로** 보이고, `v-html`은 스크립트가 실행되는지 비교합니다(로컬 테스트 환경에서만).

### 실습 2. 사용자 입력 URL 검증

```js
// src/utils/safeUrl.js
export function safeHref(input) {
  try {
    const url = new URL(input)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'
  } catch {
    return '#'
  }
}
```

```vue
<a :href="safeHref(post.link)" rel="noopener noreferrer" target="_blank">링크</a>
```

`javascript:alert(1)` 같은 프로토콜을 걸러냅니다. 새 창 링크에는 `rel="noopener noreferrer"`.

### 실습 3. 의존성·비밀 점검

```bash
npm audit                     # 알려진 취약점 목록
npm audit --omit=dev          # 운영 의존성만
npm outdated                  # 낡은 패키지
```

```bash
# 커밋 이력·작업 폴더에 비밀이 섞였는지 (예: 키 형태 문자열)
git ls-files | xargs grep -nE "(api[_-]?key|secret|password)\s*[:=]\s*['\"][^'\"]{8,}" || echo "의심 항목 없음"
```

`.github/dependabot.yml`로 의존성 업데이트 PR을 자동화합니다.

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /project
    schedule: { interval: weekly }
```

**원칙**: `npm audit fix --force`는 메이저 업데이트로 앱을 깨뜨릴 수 있으므로 **내용을 보고** 적용하고, 적용 후 테스트·빌드를 통과시킵니다.

### 실습 4. 보안 헤더 (배포 서버에서)

Nginx 예시 ([study17](./study17.md)의 컨테이너에 포함):

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.example.com; frame-ancestors 'none'" always;
```

| 헤더 | 효과 |
|---|---|
| `Content-Security-Policy` | 허용한 출처의 스크립트·연결만 허용 → XSS 피해 축소. `connect-src`에 **API 주소를 반드시 포함** |
| `X-Content-Type-Options: nosniff` | MIME 타입 추측 금지 |
| `X-Frame-Options` / `frame-ancestors` | 다른 사이트의 iframe 삽입(클릭재킹) 방지 |
| `Referrer-Policy` | 외부로 나가는 요청에 주소 정보 최소화 |

CSP는 너무 엄격하면 앱이 깨지므로 개발자도구 Console의 CSP 위반 메시지를 보며 **조금씩** 조정합니다(처음엔 `Content-Security-Policy-Report-Only`).

### 실습 5. 전역 에러 처리

```js
// src/main.js
const app = createApp(App)

// ① Vue 컴포넌트 안에서 처리되지 않은 오류
app.config.errorHandler = (err, instance, info) => {
  reportError(err, { where: 'vue', info })
}

// ② Promise 거부를 아무도 잡지 않은 경우
window.addEventListener('unhandledrejection', (e) => {
  reportError(e.reason, { where: 'promise' })
})

// ③ 그 외 스크립트 오류
window.addEventListener('error', (e) => {
  reportError(e.error ?? new Error(e.message), { where: 'window' })
})
```

```js
// src/utils/report.js — 모니터링 전송 지점을 한 곳에 모은다
import { env } from '@/config/env.js'

export function reportError(err, context = {}) {
  const payload = {
    message: err?.message ?? String(err),
    stack: err?.stack,
    requestId: err?.requestId,           // study6의 ApiError가 가진 서버 추적 id
    url: location.href,
    ...context,
  }
  if (env.isDev) console.error('[report]', payload)
  // 운영: Sentry 등으로 전송 (실습 7). 개인정보·토큰은 payload에 넣지 않는다.
}
```

### 실습 6. 컴포넌트 단위 오류 경계

```vue
<!-- src/components/ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'
import { reportError } from '@/utils/report.js'

const error = ref(null)
onErrorCaptured((err) => {
  error.value = err
  reportError(err, { where: 'boundary' })
  return false                           // 부모로 더 전파하지 않음
})
</script>

<template>
  <div v-if="error" role="alert">
    <p>화면을 표시하는 중 문제가 생겼습니다.</p>
    <p v-if="error.requestId" class="text-sm">문의 시 요청 번호: {{ error.requestId }}</p>
    <button @click="error = null">다시 시도</button>
  </div>
  <slot v-else />
</template>
```

```vue
<!-- App.vue -->
<ErrorBoundary><RouterView /></ErrorBoundary>
```

한 화면이 터져도 헤더·내비게이션은 살아 있고, 서버가 준 `requestId`를 사용자가 고객지원에 전달할 수 있게 합니다.

### 실습 7. 모니터링 — Sentry 연동

```bash
npm install @sentry/vue
```

```js
// main.js
import * as Sentry from '@sentry/vue'

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,      // DSN은 공개돼도 되는 식별자 (시크릿 아님)
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration({ router })],
    tracesSampleRate: 0.1,                      // 성능 추적 10%만
    beforeSend(event) {                         // 민감정보 제거
      if (event.request?.headers) delete event.request.headers['Authorization']
      return event
    },
  })
}
```

| 줄 | 설명 |
|---|---|
| `if (PROD)` | 개발 중에는 전송하지 않는다 |
| `tracesSampleRate: 0.1` | 비용·노이즈 조절 |
| `beforeSend` | 토큰·개인정보가 로그에 들어가지 않게 마지막으로 거른다 |

> 연동 방식은 SDK 버전에 따라 달라질 수 있으니 공식 문서의 Vue 가이드를 확인하세요. 서비스를 쓰지 않는 경우에도 `reportError`를 한 곳에 모아 두면 나중에 교체가 쉽습니다.

### 실습 8. 로깅 규칙

| 해도 되는 것 | 하면 안 되는 것 |
|---|---|
| 오류 메시지, 스택, 화면 URL, `requestId`, 사용자 id | 비밀번호, 토큰, 개인정보 전문, 카드번호 |
| 구조화된 객체 로그 | 운영 환경에 `console.log` 남발 |

`requestId` 흐름: 서버 오류 응답 `error.requestId` ↔ 서버 로그의 같은 id → 사용자가 알려 준 번호 하나로 양쪽 로그를 추적.

### 실습 9. 점검표 실행 — 보안 체크

| # | 점검 | 방법 | 결과 |
|---|---|---|---|
| 1 | `v-html`/`innerHTML` 사용처 | grep |  |
| 2 | 사용자 입력 URL | `safeHref` 적용 여부 |  |
| 3 | `npm audit --omit=dev` | high/critical 0 |  |
| 4 | `.env.production`에 비밀 | 눈으로 확인 |  |
| 5 | 번들에 비밀 문자열 | `grep -r "비밀단어" dist/` |  |
| 6 | 보안 헤더 | 배포 후 `curl -I https://도메인` |  |
| 7 | 에러 처리 | API 중단·잘못된 응답에도 화면 유지 |  |
| 8 | 로그에 토큰 | Sentry/콘솔 payload 확인 |  |

### 실행 확인

1. 의도적으로 컴포넌트에서 `throw new Error('test')` → 오류 경계 화면이 뜨고 헤더는 정상인가
2. Network를 "Offline"으로 → 연결 실패 안내가 나오고 앱이 죽지 않는가
3. 서버 500 응답 → `requestId`가 화면에 표시되는가
4. `curl -I`로 보안 헤더가 내려오는지, CSP 위반이 Console에 없는지
5. (Sentry 연동 시) 테스트 오류가 대시보드에 도착하고 `Authorization`이 없는가

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| CSP 적용 후 화면이 깨지고 Console에 `Refused to ...` | 인라인 스크립트/스타일·외부 출처 차단 | 위반 메시지의 지시어를 보고 필요한 출처만 허용, 처음엔 Report-Only |
| CSP 후 API 호출 실패 | `connect-src`에 API 주소 누락 | `connect-src`에 API 출처 추가 |
| `errorHandler`가 비동기 오류를 못 잡음 | 컴포넌트 밖 Promise | `unhandledrejection` 리스너 병행 |
| 오류 경계가 비동기 fetch 오류를 못 잡음 | `onErrorCaptured`는 렌더/라이프사이클/이벤트 오류 위주 | fetch 오류는 `try/catch`로 상태에 담아 화면에서 처리 |
| 개발 중엔 되는데 운영에서 오류 위치를 모름 | 소스맵 없음/난독화 | Sentry에 소스맵 업로드(공개 배포하지 않음) |
| `npm audit`가 수십 건 경고 | 개발 의존성·전이 의존성 포함 | `--omit=dev`로 운영 의존성 우선, 영향 판단 후 처리 |
| 로그에 이메일·토큰이 보임 | 전체 객체를 그대로 전송 | `beforeSend`·`reportError`에서 필드 화이트리스트 |
| 토큰을 `localStorage`에 두고 `v-html` 사용 | XSS + 토큰 저장 조합의 위험 | `v-html` 제거/정화, 토큰 만료 단축 |
| `target="_blank"` 링크에서 `window.opener` 접근 | `rel` 누락 | `rel="noopener noreferrer"` |

---

## ☐ 체크리스트

- ☑ `{{ }}` 자동 이스케이프와 `v-html`의 위험을 설명하고, 프로젝트의 `v-html` 사용처를 점검 — `src` 에 `v-html`/`innerHTML` 사용처 0건
- ☑ 필요 시 DOMPurify로 정화하거나 `safeHref`로 URL 검증 — `utils/safeUrl.ts` (단위 테스트 포함). 사용자 입력 HTML 을 렌더링하는 곳이 없어 DOMPurify 는 미도입
- ☑ `npm audit --omit=dev` 확인, Dependabot 설정 — `.github/dependabot.yml`. 현재 high 8건은 모두 picomatch ReDoS 하나에서 파생되며 패치 버전이 아직 없다 → CI 는 critical 만 차단
- ☑ `VITE_`/`.env`에 비밀이 없고 번들에도 없음을 확인 — `grep` 으로 운영 `dist/` 에 개발용 계정·목 토큰 문자열이 없음을 확인
- ☐ 보안 헤더(CSP, nosniff, frame-ancestors, Referrer-Policy)를 설정하고 `curl -I`로 확인 — `project/nginx/security-headers.conf` 작성 완료. Docker 를 띄워 `curl -I` 로 확인하는 것은 아직 하지 않았다
- ☑ `errorHandler` + `unhandledrejection` + `ErrorBoundary`로 오류가 화면을 죽이지 않게 함 — `main.ts`, `ErrorBoundary.vue` (단위 테스트)
- ☑ `reportError` 한 곳으로 모으고 `requestId`를 화면/로그에 노출 — `utils/report.ts`, `StateMessage`/`ErrorBoundary` 에 `requestId` 표시
- ☑ 모니터링(Sentry 등) 연동 또는 대체 수단 선택 + 민감정보 제거 — `sendBeacon` 대체 수단 (토큰·쿼리스트링 미전송)
- ☐ 보안 점검표 8개 항목에 결과 기록

## ➡️ 다음 단계 연결

안전하게 만든 앱을 **어디서든 똑같이 실행**하고 자동으로 배포하기 위해 [study17](./study17.md)에서 Docker와 배포 자동화를 다룹니다.
