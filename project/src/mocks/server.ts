import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Vitest(node) 에서 쓰는 가짜 서버. 앱 코드는 진짜 fetch 를 그대로 쓴다 (study15).
export const server = setupServer(...handlers)
