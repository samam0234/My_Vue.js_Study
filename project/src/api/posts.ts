import { request } from './client'
import { cached, invalidate } from './cache'
import type { Page, Post, PostInput, PostSort } from '@/types/api'

export interface ListPostsParams {
  q?: string
  page?: number
  limit?: number
  sort?: PostSort
  signal?: AbortSignal
}

export function listPosts({
  q,
  page = 1,
  limit = 9,
  sort = '-createdAt',
  signal,
}: ListPostsParams = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort })
  if (q) params.set('q', q)
  const query = params.toString()
  return cached(`posts:${query}`, () => request<Page<Post>>(`/api/posts?${query}`, { signal }), {
    ttl: 30_000,
    signal,
  })
}

export const getPost = (id: number | string) =>
  cached(`post:${id}`, () => request<{ data: Post }>(`/api/posts/${id}`).then((r) => r.data), {
    ttl: 60_000,
  })

export async function createPost(input: PostInput) {
  const post = await request<{ data: Post }>('/api/posts', { method: 'POST', body: input }).then(
    (r) => r.data,
  )
  invalidate('posts:')
  return post
}

export async function updatePost(id: number | string, input: Partial<PostInput>) {
  const post = await request<{ data: Post }>(`/api/posts/${id}`, {
    method: 'PATCH',
    body: input,
  }).then((r) => r.data)
  invalidate('post:')
  invalidate('posts:')
  return post
}

export async function deletePost(id: number | string) {
  await request<null>(`/api/posts/${id}`, { method: 'DELETE' })
  invalidate('post:')
  invalidate('posts:')
}
