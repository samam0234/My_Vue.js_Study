import { fileURLToPath, URL } from 'node:url'

import { readFileSync } from 'node:fs'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'

const MOCK_WORKER = fileURLToPath(new URL('./mock-public/mockServiceWorker.js', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const mockEnabled = loadEnv(mode, process.cwd(), 'VITE_').VITE_ENABLE_MOCK === 'true'

  return {
    // study10: 하위 경로 배포(예: GitHub Pages)는 BASE_PATH=/mini-board/ 로 빌드한다.
    base: process.env.BASE_PATH ?? '/',
    plugins: [
      vue(),
      tailwindcss(),
      // MSW 워커 스크립트(mock-public/mockServiceWorker.js)는 public/ 이 아니라 여기서 다룬다.
      // 개발 서버와 목 서버를 켠 빌드(E2E)에만 제공하고, 운영 빌드 결과물에는 넣지 않는다.
      {
        name: 'mock-service-worker',
        configureServer(server) {
          server.middlewares.use('/mockServiceWorker.js', (_req, res) => {
            res.setHeader('Content-Type', 'text/javascript')
            res.setHeader('Service-Worker-Allowed', '/')
            res.end(readFileSync(MOCK_WORKER))
          })
        },
        generateBundle() {
          if (mockEnabled) {
            this.emitFile({
              type: 'asset',
              fileName: 'mockServiceWorker.js',
              source: readFileSync(MOCK_WORKER),
            })
          }
        },
      },
      mode === 'development' ? vueDevTools() : undefined,
      // study12: npm run build:analyze → dist/stats.html 에서 번들 구성을 본다.
      process.env.ANALYZE || mode === 'analyze'
        ? visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false })
        : undefined,
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // study18: AI 프록시(ai-proxy/)는 더 구체적인 경로이므로 먼저 둔다.
        '/api/ai': 'http://localhost:8787',
        // study6: 실제 백엔드(공통 API 스펙 v1)가 8000번에서 돈다고 가정한다.
        '/api': 'http://localhost:8000',
      },
    },
    build: {
      // study12: 변하지 않는 라이브러리를 별도 청크로 분리해, 앱 코드만 바뀐 재배포에서 브라우저 캐시를 재사용한다.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name(id: string) {
                  return /node_modules[\/](vue|@vue|vue-router|pinia)[\/]/.test(id)
                    ? 'vue-vendor'
                    : null
                },
              },
            ],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      // Node 의 fetch 는 상대 경로를 해석하지 못하므로 테스트에서는 절대 주소를 쓴다.
      env: { VITE_API_BASE_URL: 'http://localhost:3000', VITE_ENABLE_MOCK: 'false' },
      globals: true,
      restoreMocks: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // study15: 빠진 곳을 찾는 지도. 임계값 아래로 떨어지면 CI 가 실패한다 (점진적으로 올린다).
        thresholds: { branches: 75, functions: 80, lines: 85, statements: 85 },
        include: ['src/**/*.{ts,vue}'],
        exclude: [
          'src/main.ts',
          'src/**/*.d.ts',
          'src/test/**',
          'src/mocks/browser.ts',
          'src/**/*.spec.ts',
        ],
      },
    },
  }
})
