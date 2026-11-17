# demo

study0~10 개념을 한 페이지에 쌓아 가며 실습하는 연습장입니다 (Vue 3 + Vite, JS). 학습 문서: [../README.md](../README.md).

```sh
npm install
npm run dev        # http://localhost:5173
npm run test:run   # Vitest (컴포넌트·스토어·composable)
npm run build      # dist/ (SPA fallback 용 public/_redirects, vercel.json 포함)
```

- `src/components/*Practice.vue`: 개념별 실습 (study1~8)
- `src/composables`, `src/config`, `src/utils`: study8 구조화 예시
- `.env.example`: 환경변수 목록 (`VITE_` 값은 브라우저에 공개되므로 비밀키 금지)
