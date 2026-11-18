import { request } from './client.js'

export function listPosts({ q, page = 1, limit = 9 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) params.set('q', q)
  return request(`/api/posts?${params}`) // { data: [...], meta: {...} }
}
export const getPost = (id) => request(`/api/posts/${id}`).then((r) => r.data)
export const createPost = (input) =>
  request('/api/posts', { method: 'POST', body: input }).then((r) => r.data)
export const updatePost = (id, input) =>
  request(`/api/posts/${id}`, { method: 'PATCH', body: input }).then((r) => r.data)
export const deletePost = (id) => request(`/api/posts/${id}`, { method: 'DELETE' })

export const listComments = (postId) =>
  request(`/api/posts/${postId}/comments`).then((r) => r.data)
export const createComment = (postId, body) =>
  request(`/api/posts/${postId}/comments`, { method: 'POST', body: { body } }).then((r) => r.data)
export const deleteComment = (id) => request(`/api/comments/${id}`, { method: 'DELETE' })
