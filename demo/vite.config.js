import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // study10: 하위 경로 배포(예: GitHub Pages)는 BASE_PATH=/demo/ 로 빌드한다.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // study9: Vitest — jsdom 이 브라우저 DOM(document, localStorage)을 흉내 낸다.
  test: {
    environment: 'jsdom',
    globals: true,
    restoreMocks: true,
    include: ['src/**/*.spec.js'],
  },
})
