import Anthropic from '@anthropic-ai/sdk'
import { createApp } from './app.js'

const BOARD_API_BASE = process.env.BOARD_API_BASE ?? 'http://localhost:8000'
const PORT = Number(process.env.PORT ?? 8787)

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY 환경변수가 필요합니다. (코드나 git 에 키를 넣지 마세요)')
  process.exit(1)
}

// ANTHROPIC_API_KEY 는 SDK 가 환경변수에서 자동으로 읽는다 → 코드에 키 문자열이 없다.
const client = new Anthropic()

// 토큰 검증은 백엔드(공통 API 스펙 v1)의 /api/auth/me 에 맡긴다.
async function verifyToken(authorization) {
  const res = await fetch(`${BOARD_API_BASE}/api/auth/me`, { headers: { Authorization: authorization } })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`auth server HTTP ${res.status}`)
  const { data } = await res.json()
  return data
}

createApp({ client, verifyToken }).listen(PORT, () => console.log(`ai-proxy on :${PORT}`))
