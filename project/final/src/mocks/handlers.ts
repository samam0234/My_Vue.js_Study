// 공통 API 스펙 v1 을 흉내 내는 MSW 핸들러.
// 브라우저(npm run dev, E2E 빌드)와 Vitest(node) 가 같은 핸들러를 공유한다.
import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import type { Post, PostSort } from '@/types/api'

const API = '*/api'

// 테스트(mode=test)에서는 지연을 없애 빠르게 돌린다.
const latency = (ms: number) => (import.meta.env.MODE === 'test' ? 0 : ms)

let requestCounter = 0
const requestId = () => `mock-${Date.now().toString(36)}-${++requestCounter}`

function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string[]>,
) {
  const id = requestId()
  return HttpResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}), requestId: id } },
    { status, headers: { 'X-Request-Id': id } },
  )
}

const tokenFor = (userId: number) => `mock-token-${userId}`

function authUser(request: Request) {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer mock-token-(\d+)$/.exec(header)
  if (!match) return null
  return db.users.find((u) => u.id === Number(match[1])) ?? null
}

const unauthorized = () => errorResponse(401, 'UNAUTHORIZED', '로그인이 필요합니다.')

function validatePost(input: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, string[]> = {}
  const { title, body } = input
  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) {
      fields.title = ['1~200자로 입력하세요.']
    }
  }
  if (!partial || body !== undefined) {
    if (typeof body !== 'string' || body.trim().length < 1) fields.body = ['내용을 입력하세요.']
  }
  return fields
}

function sortPosts(posts: Post[], sort: PostSort) {
  const copy = [...posts]
  if (sort === 'createdAt') copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  else if (sort === '-commentCount') copy.sort((a, b) => b.commentCount - a.commentCount)
  else copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return copy
}

const sseHeaders = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }

export const handlers = [
  http.get('*/health', () => HttpResponse.json({ status: 'ok' })),

  // ---------- 인증 ----------
  http.post(`${API}/auth/signup`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>
    const email = String(input.email ?? '').trim()
    const password = String(input.password ?? '')
    const nickname = String(input.nickname ?? '').trim()

    const fields: Record<string, string[]> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = ['올바른 이메일 형식이 아닙니다.']
    if (password.length < 8) fields.password = ['비밀번호는 8자 이상이어야 합니다.']
    if (nickname.length < 2 || nickname.length > 20) fields.nickname = ['2~20자로 입력하세요.']
    if (Object.keys(fields).length) {
      return errorResponse(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields)
    }
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return errorResponse(409, 'EMAIL_TAKEN', '이미 사용 중인 이메일입니다.', {
        email: ['이미 사용 중인 이메일입니다.'],
      })
    }

    const user = { id: db.nextUserId++, email, nickname, password }
    db.users.push(user)
    return HttpResponse.json({ data: { user: { id: user.id, email, nickname } } }, { status: 201 })
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(latency(150))
    const input = (await request.json()) as Record<string, unknown>
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === String(input.email ?? '').toLowerCase() &&
        u.password === input.password,
    )
    if (!user)
      return errorResponse(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
    return HttpResponse.json({
      data: {
        user: { id: user.id, email: user.email, nickname: user.nickname },
        accessToken: tokenFor(user.id),
      },
    })
  }),

  http.get(`${API}/auth/me`, ({ request }) => {
    const user = authUser(request)
    if (!user) return unauthorized()
    return HttpResponse.json({ data: { id: user.id, email: user.email, nickname: user.nickname } })
  }),

  http.post(`${API}/auth/logout`, ({ request }) => {
    if (!authUser(request)) return unauthorized()
    return new HttpResponse(null, { status: 204 })
  }),

  // ---------- 게시글 ----------
  http.get(`${API}/posts`, async ({ request }) => {
    await delay(latency(150))
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    // 목 서버 전용 장애 주입: E2E 와 수동 점검에서 서버 오류 화면을 재현한다.
    if (q === '__error__') {
      return errorResponse(500, 'INTERNAL', '서버 오류가 발생했습니다.')
    }
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10))
    const sortParam = url.searchParams.get('sort')
    const sort: PostSort =
      sortParam === 'createdAt' || sortParam === '-commentCount' ? sortParam : '-createdAt'

    const filtered = db.posts.filter(
      (p) => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q),
    )
    const sorted = sortPosts(filtered, sort)
    const total = sorted.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const data = sorted.slice((page - 1) * limit, page * limit)

    return HttpResponse.json({
      data,
      meta: { page, limit, total, totalPages, ...(q ? { q } : {}) },
    })
  }),

  http.get(`${API}/posts/:id`, async ({ params }) => {
    await delay(latency(100))
    const id = Number(params.id)
    if (!Number.isInteger(id)) return errorResponse(400, 'BAD_REQUEST', '잘못된 id 입니다.')
    const post = db.posts.find((p) => p.id === id)
    if (!post) return errorResponse(404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
    return HttpResponse.json({ data: post })
  }),

  http.post(`${API}/posts`, async ({ request }) => {
    const user = authUser(request)
    if (!user) return unauthorized()
    const input = (await request.json()) as Record<string, unknown>
    const fields = validatePost(input, false)
    if (Object.keys(fields).length) {
      return errorResponse(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields)
    }
    const now = new Date().toISOString()
    const post: Post = {
      id: db.nextPostId++,
      title: String(input.title).trim(),
      body: String(input.body).trim(),
      tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
      author: { id: user.id, nickname: user.nickname },
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    db.posts.push(post)
    return HttpResponse.json(
      { data: post },
      { status: 201, headers: { Location: `/api/posts/${post.id}` } },
    )
  }),

  http.patch(`${API}/posts/:id`, async ({ request, params }) => {
    const user = authUser(request)
    if (!user) return unauthorized()
    const post = db.posts.find((p) => p.id === Number(params.id))
    if (!post) return errorResponse(404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
    if (post.author.id !== user.id) {
      return errorResponse(403, 'FORBIDDEN', '본인이 쓴 글만 수정할 수 있습니다.')
    }
    const input = (await request.json()) as Record<string, unknown>
    const fields = validatePost(input, true)
    if (Object.keys(fields).length) {
      return errorResponse(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields)
    }
    if (typeof input.title === 'string') post.title = input.title.trim()
    if (typeof input.body === 'string') post.body = input.body.trim()
    if (Array.isArray(input.tags)) post.tags = input.tags.map(String)
    post.updatedAt = new Date().toISOString()
    return HttpResponse.json({ data: post })
  }),

  http.delete(`${API}/posts/:id`, ({ request, params }) => {
    const user = authUser(request)
    if (!user) return unauthorized()
    const idx = db.posts.findIndex((p) => p.id === Number(params.id))
    if (idx < 0) return errorResponse(404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
    if (db.posts[idx].author.id !== user.id) {
      return errorResponse(403, 'FORBIDDEN', '본인이 쓴 글만 삭제할 수 있습니다.')
    }
    const [removed] = db.posts.splice(idx, 1)
    db.comments = db.comments.filter((c) => c.postId !== removed.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // ---------- 댓글 ----------
  http.get(`${API}/posts/:id/comments`, ({ params }) => {
    const postId = Number(params.id)
    if (!db.posts.some((p) => p.id === postId)) {
      return errorResponse(404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
    }
    return HttpResponse.json({ data: db.comments.filter((c) => c.postId === postId) })
  }),

  http.post(`${API}/posts/:id/comments`, async ({ request, params }) => {
    const user = authUser(request)
    if (!user) return unauthorized()
    const post = db.posts.find((p) => p.id === Number(params.id))
    if (!post) return errorResponse(404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
    const input = (await request.json()) as Record<string, unknown>
    const body = String(input.body ?? '').trim()
    if (!body || body.length > 500) {
      return errorResponse(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', {
        body: ['1~500자로 입력하세요.'],
      })
    }
    const comment = {
      id: db.nextCommentId++,
      postId: post.id,
      body,
      author: { id: user.id, nickname: user.nickname },
      createdAt: new Date().toISOString(),
    }
    db.comments.push(comment)
    post.commentCount += 1
    return HttpResponse.json({ data: comment }, { status: 201 })
  }),

  http.delete(`${API}/comments/:id`, ({ request, params }) => {
    const user = authUser(request)
    if (!user) return unauthorized()
    const idx = db.comments.findIndex((c) => c.id === Number(params.id))
    if (idx < 0) return errorResponse(404, 'NOT_FOUND', '댓글을 찾을 수 없습니다.')
    if (db.comments[idx].author.id !== user.id) {
      return errorResponse(403, 'FORBIDDEN', '본인이 쓴 댓글만 삭제할 수 있습니다.')
    }
    const [removed] = db.comments.splice(idx, 1)
    const post = db.posts.find((p) => p.id === removed.postId)
    if (post) post.commentCount = Math.max(0, post.commentCount - 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // ---------- AI (study18: 실제 서버는 ai-proxy/) ----------
  http.post(`${API}/ai/summarize`, async ({ request }) => {
    if (!authUser(request)) return unauthorized()
    const input = (await request.json()) as Record<string, unknown>
    const text = String(input.text ?? '').trim()
    if (!text) {
      return errorResponse(400, 'VALIDATION_ERROR', '내용이 비었습니다.', {
        text: ['내용을 입력하세요.'],
      })
    }
    return HttpResponse.json({ data: { summary: `[목 요약] ${text.slice(0, 40)}` } })
  }),

  http.post(`${API}/ai/summarize/stream`, async ({ request }) => {
    if (!authUser(request)) return unauthorized()
    const input = (await request.json()) as Record<string, unknown>
    const text = String(input.text ?? '').trim()
    if (!text) {
      return errorResponse(400, 'VALIDATION_ERROR', '내용이 비었습니다.', {
        text: ['내용을 입력하세요.'],
      })
    }
    const chunks = ['[목 요약] ', '이 글은 ', text.slice(0, 20), ' 에 대한 ', '내용입니다.']
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        for (const c of chunks) {
          await delay(latency(120))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: c })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })
    return new HttpResponse(stream, { headers: sseHeaders })
  }),
]
