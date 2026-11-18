import { request } from './client.js'

export const signup = (input) =>
  request('/api/auth/signup', { method: 'POST', body: input, skipUnauthorizedHook: true }).then(
    (r) => r.data.user,
  )
export const login = (input) =>
  request('/api/auth/login', { method: 'POST', body: input, skipUnauthorizedHook: true }).then(
    (r) => r.data,
  )
export const me = () => request('/api/auth/me').then((r) => r.data)
export const logout = () => request('/api/auth/logout', { method: 'POST' })
