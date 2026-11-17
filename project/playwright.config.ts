import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// study15: 운영 빌드(목 서버 포함, --mode e2e)를 띄워 실제 브라우저로 검증한다.
// SPA fallback·번들·라우터 가드 같은 "빌드 후에만 드러나는 문제"까지 확인할 수 있다.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    locale: 'ko-KR',
  },
  webServer: {
    command: `npm run build:e2e && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
})
