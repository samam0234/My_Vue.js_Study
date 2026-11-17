// node --test 로 실행. 가짜 게시판 API 를 띄우고, 실제 MCP 클라이언트로 서버를 stdio 로 연결해 도구를 호출한다.
import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const posts = [
  { id: 1, title: 'Vue 반응형', body: 'ref 와 reactive', author: { nickname: 'mina' }, commentCount: 2, createdAt: '2026-11-01T00:00:00Z' },
]

function startFakeApi() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    res.setHeader('Content-Type', 'application/json')
    if (url.pathname === '/api/posts') {
      const q = url.searchParams.get('q') ?? ''
      return res.end(JSON.stringify({ data: posts.filter((p) => p.title.includes(q)) }))
    }
    const m = /^\/api\/posts\/(\d+)$/.exec(url.pathname)
    if (m && posts[0].id === Number(m[1])) return res.end(JSON.stringify({ data: posts[0] }))
    res.statusCode = 404
    res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'x' } }))
  })
  return new Promise((resolve) =>
    server.listen(0, () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })),
  )
}

async function connect(base) {
  const client = new Client({ name: 'smoke', version: '0.0.0' })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ['server.js'],
      env: { ...process.env, BOARD_API_BASE: base },
      stderr: 'pipe',
    }),
  )
  return client
}

test('도구 목록이 읽기 전용으로 노출된다', async () => {
  const { server, base } = await startFakeApi()
  const client = await connect(base)

  const { tools } = await client.listTools()
  assert.deepEqual(tools.map((t) => t.name).sort(), ['get_post', 'search_posts'])
  assert.ok(tools.every((t) => t.annotations?.readOnlyHint === true))

  await client.close()
  server.close()
})

test('search_posts / get_post 가 API 결과를 돌려준다', async () => {
  const { server, base } = await startFakeApi()
  const client = await connect(base)

  const found = await client.callTool({ name: 'search_posts', arguments: { q: 'Vue' } })
  assert.equal(found.content[0].text, '#1 Vue 반응형 (mina, 댓글 2)')

  const one = await client.callTool({ name: 'get_post', arguments: { id: 1 } })
  assert.match(one.content[0].text, /# Vue 반응형[\s\S]*ref 와 reactive/)

  await client.close()
  server.close()
})

test('API 오류는 isError 로 AI 에게 알린다, 잘못된 입력은 거부한다', async () => {
  const { server, base } = await startFakeApi()
  const client = await connect(base)

  const missing = await client.callTool({ name: 'get_post', arguments: { id: 999 } })
  assert.equal(missing.isError, true)
  assert.match(missing.content[0].text, /HTTP 404/)

  // 입력 스키마(zod) 위반: 빈 검색어
  const invalid = await client.callTool({ name: 'search_posts', arguments: { q: '' } }).catch((e) => ({ isError: true, e }))
  assert.equal(invalid.isError, true)

  await client.close()
  server.close()
})
