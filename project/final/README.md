# Mini Board (project)

Vue 3 + TypeScript + Vite 로 만든 게시판 + 로그인 서비스입니다. 학습 문서: [../../studyMidpoint.md](../../studyMidpoint.md), [../../studyFinal.md](../../studyFinal.md). 전체 목차와 명령은 [../../README.md](../../README.md) 를 보세요.

## 시작하기

```sh
npm install
npm run dev      # MSW 목 서버로 동작 (mina@example.com / password123)
```

- 실제 백엔드(공통 API 스펙 v1)를 쓰려면 `.env.development.local` 에 `VITE_ENABLE_MOCK=false`. Vite 프록시가 `/api` → `localhost:8000`, `/api/ai` → `localhost:8787` 로 전달합니다.
- 환경변수는 `.env.example` 참고. `VITE_` 값은 브라우저에 공개되므로 비밀키를 넣지 않습니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run build` | 타입 검사 + 운영 빌드 |
| `npm run lint` · `type-check` | ESLint · vue-tsc |
| `npm run test:run` · `test:coverage` | Vitest(단위·통합, MSW) |
| `npm run test:e2e` | Playwright (최초 1회 `npx playwright install chromium`) |
| `npm run ci` | lint → type-check → test → build |
| `npm run build:analyze` | 번들 분석 `dist/stats.html` |

## Docker

```sh
docker build -t mini-board-web ./   # 멀티 스테이지: node 빌드 → nginx
docker run --rm -p 8080:80 mini-board-web
```

컴포즈(프론트 + 백엔드 + AI 프록시)는 저장소 루트의 `docker-compose.yml` 을 참고하세요.

## 권장 IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Vetur 는 끕니다). 브라우저 확장: Vue.js devtools.
