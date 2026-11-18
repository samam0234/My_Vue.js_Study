import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // study10: 하위 경로 배포는 BASE_PATH=/mini-board/ 로 빌드한다.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    // study6: 백엔드(공통 API 스펙 v1)가 8000번에서 돈다. 개발 중에는 Vite 가 /api 를 대신 전달한다 (CORS 불필요).
    proxy: { '/api': 'http://localhost:8000' },
  },
  // study9: Vitest — jsdom 이 브라우저 DOM(document, localStorage)을 흉내 낸다.
  test: {
    environment: 'jsdom',
    globals: true,
    restoreMocks: true,
    fileParallelism: false, // 파일마다 같은 포트(8123)에 서버를 띄우므로 순서대로 실행한다
    // 테스트에서는 실제 개발 API 서버(server/api-server.js)를 8123 포트로 띄워 진짜 fetch 로 통신한다.
    env: { VITE_API_BASE_URL: 'http://127.0.0.1:8123' },
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.spec.js'],
  },
})
