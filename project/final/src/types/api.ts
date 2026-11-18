// 공통 API 스펙 v1 을 타입으로 옮긴 것 (study14).
export interface User {
  id: number
  email: string
  nickname: string
}

export interface Author {
  id: number
  nickname: string
}

export interface Post {
  id: number
  title: string
  body: string
  tags: string[]
  author: Author
  commentCount: number
  createdAt: string // ISO 8601 UTC
  updatedAt: string
}

export interface Comment {
  id: number
  postId: number
  body: string
  author: Author
  createdAt: string
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  q?: string
}

export interface Page<T> {
  data: T[]
  meta: PageMeta
}

export interface ApiErrorBody {
  code: string
  message: string
  fields?: Record<string, string[]>
  requestId?: string
}

export interface PostInput {
  title: string
  body: string
  tags?: string[]
}

export interface LoginResult {
  user: User
  accessToken: string
}

export type PostSort = 'createdAt' | '-createdAt' | '-commentCount'
