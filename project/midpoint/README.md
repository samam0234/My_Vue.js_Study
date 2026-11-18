# Mini Board — midpoint

study0~10 에서 배운 기능**만으로** 만든 게시판 + 로그인 서비스입니다 (Vue 3, Router, Pinia, Vite, Vitest. JS). 학습 문서: [../../studyMidpoint.md](../../studyMidpoint.md).
TypeScript·Tailwind·캐시·E2E·Docker 등 심화 기능은 [../final/](../final)(studyFinal)에서 더합니다.

## 시작하기

```sh
npm install
npm run api      # 개발 API 서버 (공통 API 스펙 v1 을 메모리에서 구현, http://localhost:8000)
npm run dev      # 다른 터미널. Vite 프록시가 /api 를 8000번으로 전달 (http://localhost:5173)
```

계정: `mina@example.com` / `password123` (로그인 화면의 "여기를 눌러 채우기"). 데이터는 메모리라 API 서버를 다시 켜면 초기화됩니다.
실제 백엔드(Django 등)가 준비되면 `npm run api` 대신 그 서버를 8000번에 띄우면 됩니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run test:run` | Vitest — 실제 개발 API 서버를 띄워 진짜 `fetch` 로 통합 테스트 (42개) |
| `npm run build` / `preview` | 운영 빌드 / 확인 (`public/_redirects`·`vercel.json` 이 SPA fallback) |

## 구조

```
server/api-server.js   개발 API 서버 (의존성 없음)
src/api/               client.js(ApiError·401 훅) · auth.js · posts.js
src/stores/            auth.js(토큰·restore) · favorites.js(localStorage)
src/composables/       useAsync · useDebounce
src/router/            라우트 + requiresAuth/guestOnly 가드
src/views/ components/ 목록·상세·글쓰기/수정·로그인·가입·404
```
