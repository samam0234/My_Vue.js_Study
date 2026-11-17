import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { env } from '@/config/env'

export const worker = setupWorker(...handlers)

/** VITE_ENABLE_MOCK=true 일 때만 main.ts 가 호출한다. */
export function startMockWorker() {
  return worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: `${env.baseUrl}mockServiceWorker.js` },
  })
}
