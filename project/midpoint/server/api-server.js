// midpoint 용 개발 API 서버 — 공통 API 스펙 v1 을 메모리에서 구현한다 (의존성 없음).
// 실제 백엔드(Django 등)가 준비되기 전에 프론트를 끝까지 만들어 보기 위한 임시 서버다.
//   npm run api        → http://localhost:8000
// 데이터는 메모리에만 있어 서버를 다시 켜면 초기화된다. 계정: mina@example.com / password123
import http from 'node:http'

const PORT = Number(process.env.PORT ?? 8000)
const HOUR = 3600 * 1000

export function createDb() {
  const now = Date.now()
  const users = [
    { id: 1, email: 'mina@example.com', nickname: 'mina', password: 'password123' },
    { id: 2, email: 'joon@example.com', nickname: 'joon', password: 'password123' },
  ]
  const titles = ['Vue 3 반응형 정리', 'Vue Router 목록과 상세', '폼 검증 패턴', 'Pinia 로 로그인 공유', 'fetch 와 오류 처리', 'Vitest 시작하기', 'Vite 환경변수', 'SPA 배포와 fallback', '컴포넌트 props 와 emit', '템플릿 문법 정리']
  const posts = titles.map((title, i) => {
    const at = new Date(now - (titles.length - i) * HOUR).toISOString()
    return { id: i + 1, title, body: `${title} 에 대한 메모입니다.`, tags: ['vue'], author: { id: (i % 2) + 1, nickname: users[i % 2].nickname }, commentCount: 0, createdAt: at, updatedAt: at }
  })
  return { users, posts, comments: [], nextUser: 3, nextPost: posts.length + 1, nextComment: 1 }
}

let seq = 0
function send(res, status, body, headers = {}) {
  const id = `api-${Date.now().toString(36)}-${++seq}`
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Request-Id': id, ...headers })
  if (status === 204) return res.end()
  if (body?.error) body.error.requestId = id
  res.end(JSON.stringify(body))
}
const fail = (res, status, code, message, fields) => send(res, status, { error: { code, message, ...(fields ? { fields } : {}) } })

function readJson(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch { resolve(null) }
    })
  })
}

export function createServer(db = createDb()) {
  const authUser = (req) => {
    const m = /^Bearer token-(\d+)$/.exec(req.headers.authorization ?? '')
    return m ? db.users.find((u) => u.id === Number(m[1])) ?? null : null
  }
  const publicUser = (u) => ({ id: u.id, email: u.email, nickname: u.nickname })

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    const path = url.pathname
    const method = req.method
    let m

    if (path === '/health') return send(res, 200, { status: 'ok' })

    const body = ['POST', 'PATCH'].includes(method) ? await readJson(req) : {}
    if (body === null) return fail(res, 400, 'BAD_REQUEST', 'JSON 형식이 올바르지 않습니다.')

    // ---- 인증 ----
    if (method === 'POST' && path === '/api/auth/signup') {
      const email = String(body.email ?? '').trim()
      const nickname = String(body.nickname ?? '').trim()
      const password = String(body.password ?? '')
      const fields = {}
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = ['올바른 이메일 형식이 아닙니다.']
      if (password.length < 8) fields.password = ['비밀번호는 8자 이상이어야 합니다.']
      if (nickname.length < 2 || nickname.length > 20) fields.nickname = ['2~20자로 입력하세요.']
      if (Object.keys(fields).length) return fail(res, 400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields)
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return fail(res, 409, 'EMAIL_TAKEN', '이미 사용 중인 이메일입니다.', { email: ['이미 사용 중인 이메일입니다.'] })
      }
      const user = { id: db.nextUser++, email, nickname, password }
      db.users.push(user)
      return send(res, 201, { data: { user: publicUser(user) } })
    }
    if (method === 'POST' && path === '/api/auth/login') {
      const user = db.users.find((u) => u.email.toLowerCase() === String(body.email ?? '').toLowerCase() && u.password === body.password)
      if (!user) return fail(res, 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
      return send(res, 200, { data: { user: publicUser(user), accessToken: `token-${user.id}` } })
    }
    if (method === 'GET' && path === '/api/auth/me') {
      const u = authUser(req)
      return u ? send(res, 200, { data: publicUser(u) }) : fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    }
    if (method === 'POST' && path === '/api/auth/logout') {
      return authUser(req) ? send(res, 204) : fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    }

    // ---- 게시글 ----
    if (method === 'GET' && path === '/api/posts') {
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10))
      const sort = url.searchParams.get('sort') ?? '-createdAt'
      let list = db.posts.filter((p) => !q || `${p.title}${p.body}`.toLowerCase().includes(q))
      list = [...list].sort((a, b) => sort === '-commentCount' ? b.commentCount - a.commentCount : sort === 'createdAt' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt))
      const total = list.length
      return send(res, 200, { data: list.slice((page - 1) * limit, page * limit), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), ...(q ? { q } : {}) } })
    }
    if (method === 'POST' && path === '/api/posts') {
      const u = authUser(req)
      if (!u) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')
      const fields = {}
      if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200) fields.title = ['1~200자로 입력하세요.']
      if (typeof body.body !== 'string' || !body.body.trim()) fields.body = ['내용을 입력하세요.']
      if (Object.keys(fields).length) return fail(res, 400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields)
      const at = new Date().toISOString()
      const post = { id: db.nextPost++, title: body.title.trim(), body: body.body.trim(), tags: Array.isArray(body.tags) ? body.tags.map(String) : [], author: { id: u.id, nickname: u.nickname }, commentCount: 0, createdAt: at, updatedAt: at }
      db.posts.push(post)
      return send(res, 201, { data: post }, { Location: `/api/posts/${post.id}` })
    }
    if ((m = /^\/api\/posts\/(\d+)$/.exec(path))) {
      const post = db.posts.find((p) => p.id === Number(m[1]))
      if (method === 'GET') return post ? send(res, 200, { data: post }) : fail(res, 404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
      const u = authUser(req)
      if (!u) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')
      if (!post) return fail(res, 404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
      if (post.author.id !== u.id) return fail(res, 403, 'FORBIDDEN', '본인이 쓴 글만 수정·삭제할 수 있습니다.')
      if (method === 'PATCH') {
        const fields = {}
        if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200)) fields.title = ['1~200자로 입력하세요.']
        if (body.body !== undefined && (typeof body.body !== 'string' || !body.body.trim())) fields.body = ['내용을 입력하세요.']
        if (Object.keys(fields).length) return fail(res, 400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields)
        if (body.title !== undefined) post.title = body.title.trim()
        if (body.body !== undefined) post.body = body.body.trim()
        if (Array.isArray(body.tags)) post.tags = body.tags.map(String)
        post.updatedAt = new Date().toISOString()
        return send(res, 200, { data: post })
      }
      if (method === 'DELETE') {
        db.posts = db.posts.filter((p) => p !== post)
        db.comments = db.comments.filter((c) => c.postId !== post.id)
        return send(res, 204)
      }
    }

    // ---- 댓글 ----
    if ((m = /^\/api\/posts\/(\d+)\/comments$/.exec(path))) {
      const post = db.posts.find((p) => p.id === Number(m[1]))
      if (!post) return fail(res, 404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
      if (method === 'GET') return send(res, 200, { data: db.comments.filter((c) => c.postId === post.id) })
      if (method === 'POST') {
        const u = authUser(req)
        if (!u) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')
        const text = String(body.body ?? '').trim()
        if (!text || text.length > 500) return fail(res, 400, 'VALIDATION_ERROR', '입력값을 확인하세요.', { body: ['1~500자로 입력하세요.'] })
        const c = { id: db.nextComment++, postId: post.id, body: text, author: { id: u.id, nickname: u.nickname }, createdAt: new Date().toISOString() }
        db.comments.push(c)
        post.commentCount += 1
        return send(res, 201, { data: c })
      }
    }
    if (method === 'DELETE' && (m = /^\/api\/comments\/(\d+)$/.exec(path))) {
      const u = authUser(req)
      if (!u) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')
      const c = db.comments.find((x) => x.id === Number(m[1]))
      if (!c) return fail(res, 404, 'NOT_FOUND', '댓글을 찾을 수 없습니다.')
      if (c.author.id !== u.id) return fail(res, 403, 'FORBIDDEN', '본인이 쓴 댓글만 삭제할 수 있습니다.')
      db.comments = db.comments.filter((x) => x !== c)
      const post = db.posts.find((p) => p.id === c.postId)
      if (post) post.commentCount = Math.max(0, post.commentCount - 1)
      return send(res, 204)
    }

    return fail(res, 404, 'NOT_FOUND', '없는 경로입니다.')
  })
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('api-server.js')) {
  createServer().listen(PORT, () => console.log(`midpoint API server on http://localhost:${PORT}`))
}
