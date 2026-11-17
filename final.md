# final — 심화 응용: 운영 가능한 Mini Board 완성

> 🎯 **목표**: midpoint의 게시판+로그인에 study11~18(상태 심화·성능·라이브러리·타입·테스트/CI·보안·Docker 배포·AI)을 합쳐, **측정·검증·자동 배포가 갖춰진 운영 가능한 Vue 서비스**를 완성한다.

- 이전: [study18](./study18.md) AI 연동·MCP, [midpoint](./midpoint.md)
- 참고(옛 버전): [studyFinal.md](./studyFinal.md) — JSONPlaceholder 기반의 첫 종합 실습
- 이 문서는 **완성 계획과 검증 기록표**입니다. 아직 구현·측정하지 않은 항목은 `☐`, 값은 `____`로 남겨 두며, 실제로 실행한 뒤에만 채웁니다.

---

## 1. 목표

### 1.1 "운영 가능"의 정의

| 영역 | 합격 기준 |
|---|---|
| 기능 | midpoint의 F1~F9 + 이번 확장 기능이 동작 |
| 신뢰성 | 서버 오류·오프라인·만료 토큰에도 화면이 죽지 않고, 원인을 추적할 수 있다 (`requestId`, 오류 보고) |
| 성능 | 운영 빌드 기준 Lighthouse 목표 달성, 초기 JS 상한 준수 |
| 보안 | 보안 점검표 전 항목 통과, 비밀 노출 없음 |
| 품질 | 타입·린트·단위·통합·E2E가 **CI에서 자동**으로 통과 |
| 배포 | push → 테스트 → 이미지/정적 빌드 → 배포 → smoke test가 자동, 롤백 방법 확정 |

### 1.2 정량 목표 (측정 후 조정)

| 지표 | 목표 | 근거 |
|---|---|---|
| Lighthouse Performance (모바일, 운영 빌드) | 90 이상 | study12 |
| LCP | 2.5초 이하 | study12 |
| 초기 JS (gzip) | 150KB 이하 (예시값 — midpoint 기준선을 측정해 현실적으로 재설정) | study12 |
| 단위+통합 테스트 | 핵심 로직 분기 커버리지 80% 이상 (상태·API·검증) | study15 |
| E2E | 핵심 시나리오 4개 이상 통과 | study15 |
| `npm audit --omit=dev` | high/critical 0 | study16 |
| CI 전체 시간 | 10분 이내 | study15 |

### 1.3 범위 정리

```
midpoint(기능 F1~F9)
   + study11  캐시·취소·낙관적 업데이트
   + study12  측정 기반 최적화
   + study13  Tailwind · VueUse · dayjs · (axios) · UI 래퍼
   + study14  TypeScript · ESLint · Prettier
   + study15  Vitest · MSW · Playwright · GitHub Actions
   + study16  보안 점검 · 오류 경계 · 모니터링
   + study17  Docker · Nginx · 자동 배포
   + study18  AI 요약(프록시) · MCP(읽기 전용)
   = final
```

---

## 2. 기능 확장

midpoint 기능 위에 아래를 **우선순위 순으로** 추가합니다. 각 기능은 "어느 study 기법을 쓰는지"를 명시합니다.

| # | 기능 | 설명 | 쓰는 기법 |
|---|---|---|---|
| X1 | 목록 캐시 + 경쟁 상태 방지 | 같은 목록 재방문 시 즉시 표시(SWR), 검색 중 이전 요청 취소 | study11: `cached`, `AbortController` |
| X2 | 댓글 작성/삭제 + 낙관적 업데이트 | 등록 즉시 화면 반영, 실패 시 롤백 | study11 |
| X3 | URL 상태 동기화 | `?q=&page=&sort=`를 URL에 유지(공유·새로고침) | study4, 11 |
| X4 | 상대 시간·지역 시간 표시 | "3시간 전", 툴팁에 절대 시간 | study13: dayjs |
| X5 | UI 일관성 | 버튼·입력·상태 메시지를 래퍼 컴포넌트로 통일, Tailwind | study13 |
| X6 | AI 요약 (로그인 사용자) | 상세 화면 "AI 요약", 스트리밍·중지 | study18 |
| X7 | 오류 경계 + `requestId` 표시 | 화면별 오류 격리, 문의용 요청 번호 | study16 |
| X8 | 접근성 기본 | `label for`, 포커스 이동, `role="alert"`, 키보드 조작 | study5, 16 |
| X9 | (선택) MCP 읽기 전용 서버 | AI 도구에서 게시판 검색 | study18 |
| X10 | (선택) 즐겨찾기 서버 동기화 | 서버에 엔드포인트가 있을 때만 | study11 |

### 2.1 최종 폴더 구조

```
frontend_study/vue.js/
├─ .github/workflows/
│  ├─ ci.yml                  # study15
│  └─ deploy.yml              # study17
├─ project/
│  ├─ Dockerfile · nginx.conf · .dockerignore
│  ├─ .env.example · .env.development · .env.production
│  ├─ eslint.config.js · .prettierrc.json · tsconfig.json · env.d.ts
│  ├─ playwright.config.ts · vite.config.ts
│  ├─ e2e/                    # Playwright
│  └─ src/
│     ├─ main.ts              # errorHandler, (Sentry), restore() 후 mount
│     ├─ config/env.ts
│     ├─ types/api.ts
│     ├─ api/                 # client.ts, cache.ts, auth.ts, posts.ts, comments.ts, ai.ts
│     ├─ stores/              # auth.ts, favorites.ts
│     ├─ composables/         # useAsync, useDebouncedRef, useLatestRequest, useStreamSummary
│     ├─ components/          # AppButton, FormField, StateMessage, ErrorBoundary, Pagination, PostCard ...
│     ├─ utils/               # format.ts, safeUrl.ts, report.ts
│     ├─ router/index.ts
│     ├─ test/                # MSW server, setup
│     └─ views/
├─ ai-proxy/                  # (X6) 키 보관·로그인 검증·스트리밍 중계
├─ board-mcp/                 # (X9) 읽기 전용 MCP 서버
├─ docker-compose.yml
└─ .mcp.json
```

### 2.2 확장 구현 순서

| 단계 | 작업 | 완료 확인 |
|---|---|---|
| 1 | 기준선 측정(midpoint 결과): Lighthouse, 번들 크기, 테스트 수 | 기록표 §3.1 채움 |
| 2 | TypeScript·ESLint·Prettier 적용 (study14) — 이후 모든 작업이 타입 보호 아래 | `type-check`, `lint` 통과 |
| 3 | 테스트 기반 정비: 커버리지, MSW 통합 테스트 (study15) | `test:coverage` 통과 |
| 4 | 데이터 흐름: 캐시·취소·URL 상태 (X1, X3) | Network에서 `canceled`, 캐시 적중 |
| 5 | 댓글 + 낙관적 업데이트 (X2) | 실패 시 롤백 확인 |
| 6 | UI 정리: Tailwind, 래퍼, dayjs (X4, X5, X8) | 화면 일관, 접근성 점검 |
| 7 | 오류 경계·보고·`requestId` (X7) | 강제 오류에도 헤더 유지 |
| 8 | AI 요약 (X6), (선택) MCP (X9) | 인젝션 테스트 통과 |
| 9 | 성능 최적화 + 재측정 (study12) | 목표 지표 달성 |
| 10 | 보안 점검표 + 보안 헤더 (study16) | 점검표 전 항목 ☑ |
| 11 | E2E 시나리오 + CI 완성 (study15) | CI 초록 |
| 12 | Docker·compose·자동 배포·smoke test (study17) | 배포 URL 정상 |

> 순서 이유: **타입·테스트를 먼저** 깔아 두어야 이후 기능 추가·성능 변경·리팩터링이 안전합니다. 성능 최적화는 기능이 갖춰진 뒤에 **측정하고** 합니다.

---

## 3. 성능·보안 점검

### 3.1 성능 — 측정 기록표 (study12 방식, 운영 빌드 `build` + `preview`, 시크릿 창, 3회 중앙값)

| 지표 | midpoint 기준선 | 변경 내용 | final | 목표 달성 |
|---|---|---|---|---|
| Lighthouse Performance |  |  |  | ☐ |
| LCP |  |  |  | ☐ |
| INP |  |  |  | ☐ |
| CLS |  |  |  | ☐ |
| 초기 JS (gzip) |  |  |  | ☐ |
| 초기 요청 수 |  |  |  | ☐ |
| 목록 재방문 시 API 요청 수 |  |  |  | ☐ |
| 검색 5글자 입력 시 요청 수 |  |  |  | ☐ |

점검 항목:

- ☐ 라우트 지연 로딩, 무거운 컴포넌트(마크다운·차트 등)는 `defineAsyncComponent`
- ☐ `manualChunks`로 vendor 분리, `visualizer`로 가장 큰 모듈 확인
- ☐ 검색 디바운스 + 요청 취소
- ☐ 이미지에 `width`/`height`/`loading="lazy"`
- ☐ Nginx gzip, 해시 자산 `immutable`, `index.html` `no-cache`
- ☐ 라이브러리 도입(Tailwind·UI·dayjs 등)마다 번들 증가량을 기록하고 정당화
- ☐ **효과가 숫자로 확인된 최적화만** 유지

### 3.2 보안 — 점검표 (study16)

| # | 점검 | 방법 | 결과 |
|---|---|---|---|
| 1 | `v-html`/`innerHTML` 사용처 | `grep` (AI 출력 포함) | ☐ |
| 2 | 사용자 입력 URL (`safeHref`) | 코드 점검 | ☐ |
| 3 | `npm audit --omit=dev` high/critical 0 | 실행 | ☐ |
| 4 | 비밀이 `VITE_`·`.env.production`·번들·git에 없음 | `grep -r "sk-" dist/`, 파일 점검 | ☐ |
| 5 | 보안 헤더(CSP, nosniff, frame-ancestors, Referrer-Policy) | `curl -I https://도메인` | ☐ |
| 6 | 토큰 보관 위험(XSS) 인지, 만료 처리(401) | 시나리오 | ☐ |
| 7 | AI 프록시: 로그인 필수·입력 제한·`max_tokens`·rate limit | 코드·요청 테스트 | ☐ |
| 8 | 오류·로그에 토큰/개인정보 없음 | 오류 보고 payload 점검 | ☐ |
| 9 | 컨테이너 이미지에 `.env.local`·비밀 없음 | `docker history`, `.dockerignore` | ☐ |
| 10 | 의존성 자동 업데이트(Dependabot) | 설정 확인 | ☐ |

### 3.3 운영 안정성 점검 (장애 주입)

| 장애 상황 | 기대 동작 | 결과 |
|---|---|---|
| 백엔드 중지 | 목록에 연결 실패 안내 + 다시 시도, 앱은 유지 | ☐ |
| API 500 | `requestId` 표시, 오류 보고 전송 | ☐ |
| 토큰 만료(401) | 로그인 화면 이동 후 원래 화면 복귀 | ☐ |
| 남의 글 삭제(403) | 안내 메시지(로그인 화면으로 가지 않음) | ☐ |
| 컴포넌트에서 예외 | ErrorBoundary가 해당 영역만 대체 | ☐ |
| 오프라인 | 안내 표시, 복구 후 재시도 | ☐ |
| AI 업스트림 실패 | "요약 실패" 안내, 글 열람은 영향 없음 | ☐ |

---

## 4. Docker·외부 배포

### 4.1 산출물

- ☐ `project/Dockerfile` (멀티 스테이지: node 빌드 → nginx 실행)
- ☐ `project/nginx.conf` (SPA fallback, `/healthz`, 캐시 정책, 보안 헤더, 선택: `/api` 프록시)
- ☐ `.dockerignore`
- ☐ `docker-compose.yml` (web + backend [+ ai-proxy])
- ☐ `.github/workflows/ci.yml`, `deploy.yml`

### 4.2 파이프라인

```
push (master)
  └─ ci.yml / deploy.yml
       ├─ lint → type-check → unit·integration (coverage) → build
       ├─ e2e (Playwright, 운영 빌드 대상)
       ├─ docker build → GHCR push (태그: git sha, latest)
       ├─ 배포 (컨테이너 호스팅의 Deploy Hook 또는 정적 호스팅 업로드)
       └─ smoke test: /healthz, /, /posts/1 (SPA fallback)  → 실패 시 이전 sha 태그로 롤백
```

### 4.3 환경 구성

| 환경 | 프론트 | 백엔드 | 비고 |
|---|---|---|---|
| 개발 | `npm run dev` (5173) | 로컬 (8000), Vite 프록시 | CORS 불필요 |
| 로컬 통합 | `docker compose up` | 같은 compose | Nginx가 `/api` 프록시 |
| 운영 | 선택한 호스팅 | 선택한 호스팅 | 서버 `CORS_ORIGIN`에 운영 도메인, 보안 헤더 |

### 4.4 배포 점검표

- ☐ `docker build`/`run` 로컬 성공, 이미지 크기 기록: ____ MB
- ☐ `docker compose up`으로 프론트·백엔드 연동, `/posts/1` 새로고침 OK
- ☐ Actions에서 `test → image → deploy` 초록, 레지스트리에 `:sha` 태그
- ☐ 배포 URL 접속, 로그인·작성·AI 요약 동작
- ☐ smoke test 자동화, 롤백 절차 문서화(이전 sha 태그로 재배포)
- ☐ 비밀은 `secrets`, 공개 설정은 `vars`로 구분
- ☐ 배포 URL: ____ / 마지막 배포 커밋: ____

---

## 5. 테스트 결과

> 아래는 **실행 후 기록하는 표**입니다. 값이 비어 있으면 아직 실행하지 않은 것입니다.

### 5.1 자동 테스트 요약

| 구분 | 도구 | 테스트 수 | 통과 | 실패 | 커버리지(분기) | 실행 시간 |
|---|---|---|---|---|---|---|
| 정적 분석 | ESLint | — | ____ | ____ | — | ____ |
| 타입 검사 | vue-tsc | — | ____ | ____ | — | ____ |
| 단위 | Vitest | ____ | ____ | ____ | ____% | ____ |
| 통합 | Vitest + MSW | ____ | ____ | ____ | ____% | ____ |
| E2E | Playwright | ____ | ____ | ____ | — | ____ |
| CI 전체 | GitHub Actions | — | ____ | ____ | — | ____ |

### 5.2 E2E 시나리오 체크

| # | 시나리오 | 결과 |
|---|---|---|
| E1 | 비로그인으로 목록·상세 열람 | ☐ |
| E2 | `/posts/new` 접근 → 로그인 → 원래 화면 복귀 | ☐ |
| E3 | 새로고침 후 로그인 유지 | ☐ |
| E4 | 글 작성 → 상세 → 수정 → 삭제 | ☐ |
| E5 | 남의 글 수정/삭제 불가(403 안내) | ☐ |
| E6 | 서버 오류 시 오류 화면 + 다시 시도 | ☐ |
| E7 | AI 요약(스트리밍·중지) | ☐ |
| E8 | 운영 빌드 `/posts/1` 새로고침 (SPA fallback) | ☐ |

### 5.3 수동 점검

- ☐ Console에 `[Vue warn]`·빨간 오류 없음 (운영 빌드)
- ☐ 키보드만으로 로그인·글 작성 가능
- ☐ 모바일 폭(≈375px)에서 레이아웃 무너지지 않음
- ☐ 서로 다른 브라우저 2종 확인

### 5.4 발견한 결함 기록

| # | 증상 | 원인 | 수정 | 재발 방지 테스트 |
|---|---|---|---|---|
|  |  |  |  |  |

(버그를 고칠 때마다 **그 버그를 잡는 테스트를 먼저 추가**하는 습관을 기록으로 남깁니다.)

---

## 6. 최종 회고

### 6.1 결과 요약

- 완성일: ____
- 최종 구성: Vue ____ · Router ____ · Pinia ____ · Vite ____ · Node ____
- 구현한 확장(X1~X10): ____ / 보류: ____
- 정량 목표 달성: ____ / 7

### 6.2 학습 여정 되돌아보기

| 구간 | 가장 크게 배운 것 | 아직 헷갈리는 것 |
|---|---|---|
| 기초 (study0~10) |  |  |
| midpoint |  |  |
| 심화 (study11~18) |  |  |
| final |  |  |

### 6.3 Keep / Problem / Try

- **Keep (계속할 것)**:
- **Problem (막혔던 것 → 원인 → 해결)**:
- **Try (다음에 시도할 것)**:

### 6.4 한 눈에 보는 성장 기록

| 항목 | 시작(study0) | 현재(final) |
|---|---|---|
| 서버와의 통신 | 공개 API 읽기 | 인증·캐시·취소·오류 구조화 |
| 상태 | `ref` | Pinia + 서버 상태 캐시 |
| 품질 보증 | 브라우저에서 눌러 보기 | 타입·린트·단위·통합·E2E·CI |
| 배포 | 없음(`npm run dev`) | Docker/정적 호스팅 자동 배포 + smoke test |
| 보안 | 인식 없음 | 점검표·헤더·정화·오류 보고 |

### 6.5 앞으로의 과제 (이 저장소를 넘어서)

- ☐ 서버 상태 라이브러리(TanStack Query) 정식 도입 여부 결정
- ☐ SSR/SSG(Nuxt) 필요성 검토 — SEO가 중요한 페이지가 생길 때
- ☐ 접근성 자동 점검(axe) CI 추가
- ☐ 런타임 설정 주입으로 "하나의 이미지, 여러 환경" 구성
- ☐ 실사용 지표(Web Vitals) 수집·대시보드

## ➡️ 다음 단계 연결

이 저장소의 Vue 로드맵은 여기서 끝입니다. 운영 중 발견한 문제는 [study9](./study9.md)·[study16](./study16.md)의 오류 노트에 추가하고, 다른 주제(새 프로젝트)로 넘어갈 때는 이 문서의 §5·§6 기록 방식을 그대로 재사용하세요.
