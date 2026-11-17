import { request } from './client'
import { invalidate } from './cache'
import type { Comment } from '@/types/api'

export const listComments = (postId: number | string) =>
  request<{ data: Comment[] }>(`/api/posts/${postId}/comments`).then((r) => r.data)

export async function createComment(postId: number | string, body: string) {
  const comment = await request<{ data: Comment }>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: { body },
  }).then((r) => r.data)
  invalidate('posts:') // 목록의 commentCount 가 바뀐다
  invalidate('post:')
  return comment
}

export async function deleteComment(id: number) {
  await request<null>(`/api/comments/${id}`, { method: 'DELETE' })
  invalidate('posts:')
  invalidate('post:')
}
