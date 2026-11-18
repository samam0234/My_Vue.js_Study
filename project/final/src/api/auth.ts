import { request } from './client'
import type { LoginResult, User } from '@/types/api'

export interface SignupInput {
  email: string
  password: string
  nickname: string
}

export const signup = (input: SignupInput) =>
  request<{ data: { user: User } }>('/api/auth/signup', {
    method: 'POST',
    body: input,
    skipUnauthorizedHook: true,
  }).then((r) => r.data.user)

export const login = (input: { email: string; password: string }) =>
  request<{ data: LoginResult }>('/api/auth/login', {
    method: 'POST',
    body: input,
    skipUnauthorizedHook: true,
  }).then((r) => r.data)

export const me = () => request<{ data: User }>('/api/auth/me').then((r) => r.data)

export const logout = () => request<null>('/api/auth/logout', { method: 'POST' })
