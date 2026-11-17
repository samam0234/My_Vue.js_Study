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
├─ final.md                   # 심화 응용
├─ studyFinal.md              # 첫 종합 실습 기록 (JSONPlaceholder 미니 게시판)
├─ demo/                      # 개념별 실습 연습장 (Vue 3 + Vite)
├─ project/                   # 미니 게시판 (Vue 3 + Vite + Router + Pinia)
└─ .agent/ .claude/ .codex/ .grok/   # 작업 규칙·에이전트별 인수인계 문서
```

## 실행 방법

요구 사항: **Node.js `^22.18.0` 또는 `>=24.12.0`** (`package.json`의 `engines`)

```bash
# 연습장
cd demo
npm install
npm run dev        # http://localhost:5173

# 미니 게시판
cd project
npm install
npm run dev
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 배포용 빌드 → `dist/` |
| `npm run preview` | 빌드 결과를 로컬에서 확인 |

사용 버전: Vue 3.5, Vue Router 5, Pinia 4, Vite 8.

## 현재 구현 상태와 문서의 관계

- **구현 완료(코드 있음)**: study0~7 범위의 실습 — `demo/`(개념별), `project/`(JSONPlaceholder + 가상 로그인 미니 게시판)
- **계획·예시 코드(문서만 있음)**: study8~18, midpoint, final의 코드는 **아직 저장소에 반영하지 않은 실습 예시**입니다. 문서의 `☐`는 직접 실습하며 체크합니다. (`☑` = 이미 코드로 구현한 항목)
- 백엔드 연동(study6~7, midpoint)은 **「공통 API 스펙 v1」**(`/api/posts`, `/api/auth/*`, `{ data }` / `{ error }` 응답 형식)을 따르는 서버를 전제로 합니다.

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
