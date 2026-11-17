# Vue.js 학습 저장소

Vue 3 + Vite로 **환경 설정 → 기초 문법 → 미니 서비스 → 운영 수준 심화**까지 단계별로 정리한 학습 기록입니다. 이 저장소는 **Vue 하나만** 다룹니다.

- 대상: HTML/CSS/JS는 알고, 이미 만든 화면을 **컴포넌트·상태·라우팅**으로 조직하는 첫 프레임워크를 배우려는 사람
- 실습 코드: [`demo/`](./demo)(개념별 연습장), [`project/`](./project)(미니 게시판)
- 모든 학습 문서의 구성: `🎯 목표 한 줄 → 📖 이론 → 🛠️ 실기(코드·줄별 설명) → ⚠️ 오류 노트 → ☐ 체크리스트 → ➡️ 다음 단계 연결`

## 학습 순서

### 기초 구간 (study0~10)

| 문서 | 주제 | 한 줄 요약 |
|---|---|---|
| [study0](./study0.md) | 환경 설정 | Node, `npm create vue`, 폴더 구조, 실행 확인, 핵심 용어 |
| [study1](./study1.md) | Hello World와 기본 문법 | 첫 화면, `{{ }}` · `v-bind` · `v-on` · `v-for` · `v-if` · `v-model` |
| [study2](./study2.md) | 핵심 구조: 컴포넌트 | SFC, `props` / `emit` / 슬롯 |
| [study3](./study3.md) | 데이터 다루기 | `ref` · `reactive` · `computed` · `watch` · 라이프사이클 |
| [study4](./study4.md) | 라우팅·요청 처리 | Vue Router, 목록 → 상세, 가드 전 단계, 요청·응답 흐름 |
| [study5](./study5.md) | 폼·입력·검증 | `v-model`, 오류 표시, 서버 검증 오류 매핑 |
| [study6](./study6.md) | DB·API 연동 | API 클라이언트, CRUD, 프록시, 작성·수정 화면 |
| [study7](./study7.md) | 인증·보안 기초 | Pinia, `accessToken`, 새로고침 유지, 라우트 가드, 401/403 |
| [study8](./study8.md) | 구조화·재사용 | 폴더 구조, composable, `.env` 분리 |
| [study9](./study9.md) | 테스트·디버깅 | Vitest, DevTools, 자주 나는 오류 |
| [study10](./study10.md) | 배포·정리 | `build` / `preview`, SPA fallback, 총정리·복습 문제 |

### 중간 응용

| 문서 | 내용 |
|---|---|
| [midpoint](./midpoint.md) | study0~10 범위만으로 **게시판 + 로그인** 서비스 완성 (목표 · 기능 목록 · 폴더 구조 · 구현 순서 · 완성 체크리스트 · 회고) |

### 후반 심화 구간 (study11~18)

| 문서 | 주제 | 한 줄 요약 |
|---|---|---|
| [study11](./study11.md) | 상태·데이터 흐름 심화 | 캐시, 요청 취소, 낙관적 업데이트, 서버 상태 |
| [study12](./study12.md) | 성능 최적화 | Lighthouse·번들 분석으로 측정 → 최적화 → 재측정 |
| [study13](./study13.md) | 생태계 라이브러리 | Tailwind, VueUse, dayjs, axios, UI 라이브러리, 도입 기준 |
| [study14](./study14.md) | TypeScript·정적 분석 | TypeScript, `vue-tsc`, ESLint, Prettier |
| [study15](./study15.md) | 고급 테스트·CI | 통합(MSW), E2E(Playwright), GitHub Actions |
| [study16](./study16.md) | 보안·운영 심화 | XSS·헤더·의존성 점검, 오류 처리, 로깅, 모니터링 |
| [study17](./study17.md) | Docker·배포 자동화 | 멀티 스테이지 Dockerfile + Nginx, GHCR, 자동 배포 |
| [study18](./study18.md) | AI 연동·MCP | 키를 숨기는 프록시, 스트리밍, MCP 서버 기초 |

### 심화 응용

| 문서 | 내용 |
|---|---|
| [final](./final.md) | midpoint + study11~18을 합쳐 **운영 가능한 서비스** 완성 (목표 · 기능 확장 · 성능·보안 점검 · Docker·외부 배포 · 테스트 결과 · 최종 회고) |

> [studyFinal.md](./studyFinal.md)는 JSONPlaceholder 기반으로 만든 **첫 종합 실습(`project/`) 기록**으로, midpoint 이전의 출발점입니다.

## 프로젝트 구조

```
vue.js/
├─ README.md                  # 이 문서
├─ study0.md ~ study10.md     # 기초 구간
├─ midpoint.md                # 중간 응용
├─ study11.md ~ study18.md    # 후반 심화 구간
├─ final.md                   # 심화 응용 (실측 기록표 포함)
├─ studyFinal.md              # 첫 종합 실습 기록 (JSONPlaceholder 미니 게시판)
├─ demo/                      # study0~10 개념별 실습 연습장 (JS, Vue 3 + Vite, Vitest)
├─ project/                   # Mini Board — midpoint + final 구현 (TypeScript, Tailwind, Vitest, Playwright, Docker)
│  ├─ src/{api,mocks,stores,composables,components,views,router,utils,config,types,test}
│  ├─ e2e/                    # Playwright E2E
│  ├─ nginx/ · Dockerfile     # 운영 이미지 (Nginx)
│  └─ mock-public/            # MSW 워커 스크립트 (개발·E2E 빌드에서만 제공)
├─ ai-proxy/                  # AI 프록시 (키 보관·로그인 확인·SSE 중계), 테스트 포함
├─ board-mcp/                 # 게시판 읽기 전용 MCP 서버, 테스트 포함
├─ docker-compose.yml         # web(Nginx) + backend + ai-proxy
├─ .mcp.json                  # MCP 서버 등록
├─ .github/                   # CI(ci.yml), 배포(deploy.yml), Dependabot
└─ .agent/ .claude/ .codex/ .grok/   # 작업 규칙·에이전트별 인수인계 문서
```

## 실행 방법

요구 사항: **Node.js `^22.18.0` 또는 `>=24.12.0`** (`package.json`의 `engines`)

```bash
# 연습장 (study0~10)
cd demo
npm install
npm run dev          # http://localhost:5173
npm run test:run     # Vitest

# Mini Board (midpoint + final)
cd project
npm install
npm run dev          # 백엔드 없이 MSW 목 서버로 동작 (계정: mina@example.com / password123)
```

### project/ 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버. 기본값은 **목 서버 ON**(`.env.development`의 `VITE_ENABLE_MOCK=true`) |
| `npm run build` | 타입 검사 + 운영 빌드 → `dist/` (목 서버·개발용 계정은 번들에서 제외) |
| `npm run preview` | 빌드 결과 확인 |
| `npm run lint` / `type-check` | ESLint / vue-tsc |
| `npm run test:run` / `test:coverage` | Vitest 단위·통합 (MSW) / 커버리지 |
| `npm run test:e2e` | Playwright E2E (운영 빌드 + 목 서버, 최초 1회 `npx playwright install chromium`) |
| `npm run ci` | lint → type-check → test → build |
| `npm run build:analyze` | 번들 분석 `dist/stats.html` |

실제 백엔드(공통 API 스펙 v1)에 붙이려면 `project/.env.development.local` 에 `VITE_ENABLE_MOCK=false` 를 두면 Vite 프록시가 `/api` 를 `localhost:8000` 으로 보냅니다(AI 는 `/api/ai` → `localhost:8787`).

```bash
# AI 프록시 / MCP 서버 (각각 npm install 후)
cd ai-proxy  && npm test      # 키가 필요하면 ANTHROPIC_API_KEY 환경변수로 (코드·git 에 넣지 않는다)
cd board-mcp && npm test
```

사용 버전: Vue 3.5, Vue Router 5, Pinia 4, Vite 8, TypeScript 6, Vitest 5, Playwright 1.6x, MSW 3.

## 현재 구현 상태와 문서의 관계

| 범위 | 상태 |
|---|---|
| study0~7 | `demo/` 개념별 실습 + `project/` 구현 완료 |
| study8~10 | `demo/`(환경변수·composable·Vitest·SPA fallback), `project/` 구현 완료 |
| midpoint | `project/` 의 기능 F1~F9 구현, 테스트 통과 |
| study11~16, 18 | `project/`, `ai-proxy/`, `board-mcp/` 구현·테스트 통과 (실제 AI API 호출만 미검증) |
| study17 | `Dockerfile`·`nginx/`·`docker-compose.yml`·`deploy.yml` **작성 완료, 아직 실행하지 않음**(Docker 데몬·GitHub Actions 첫 실행 전) |
| final | 실측 기록표 작성. Lighthouse·컨테이너 실행·실제 배포는 미측정/미실행 |

- 문서의 `☑` 는 코드로 구현하고 확인한 항목, `☐` 는 아직 하지 않았거나 학습자가 직접 해 보는 항목(설명하기, 수동 확인, 실제 배포 등)입니다.
- 백엔드가 없어서 API 는 **MSW 목 서버**(`project/src/mocks/`)가 대신하고, 단위·통합·E2E 가 같은 핸들러를 공유합니다. 백엔드 연동은 **「공통 API 스펙 v1」**(`/api/posts`, `/api/auth/*`, `{ data }` / `{ error }` 응답 형식)을 따르는 서버를 전제로 합니다.

## 기존 문서 → 새 문서 매핑

처음 작성한 study0~7(이론/개별 실습)은 현재의 study0~7에 흡수되었습니다. 이전 버전은 git 이력에서 볼 수 있습니다.

| 이전 문서 | 현재 위치 |
|---|---|
| study0 (이론 총정리) | study0(환경·용어), study1~7 각 장 이론 |
| study1 (프로젝트 생성 + 템플릿 문법) | study0 + study1 |
| study2 (ref/reactive/computed/watch) | study3 |
| study3 (props/emit) | study2 |
| study4 (Router) | study4 |
| study5 (폼 검증) | study5 |
| study6 (fetch) | study6 |
| study7 (Pinia 로그인) | study7 |
| studyFinal (미니 게시판) | studyFinal(유지), midpoint·final의 출발점 |

## 작업 규칙

- 공통 규칙: [.agent/AGENTS.md](./.agent/AGENTS.md), 커밋 규칙: [.agent/COMMIT_GUIDE.md](./.agent/COMMIT_GUIDE.md)
- 언어: 문서·커밋 설명은 한글, 커밋 타입·코드·식별자·파일명은 영어
- 커밋 형식: `type: 한글 설명` (예: `docs: study8 구조화 문서 추가`)

## 참고

- 저장소: [samam0234/My_Vue.js_Study](https://github.com/samam0234/My_Vue.js_Study)
- Vue 공식 문서: <https://vuejs.org/>, Vue Router: <https://router.vuejs.org/>, Pinia: <https://pinia.vuejs.org/>, Vite: <https://vite.dev/>
