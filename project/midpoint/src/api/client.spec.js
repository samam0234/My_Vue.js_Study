import { request, ApiError, configureApi } from './client.js'
import { listPosts, getPost, createPost, updatePost, deletePost } from './posts.js'

async function rejection(promise) {
  try {
    await promise
  } catch (e) {
    return e
  }
  throw new Error('reject 되어야 합니다.')
}

describe('API 클라이언트 (실제 개발 서버와 통신)', () => {
  it('목록은 { data, meta } 를 준다', async () => {
    const res = await listPosts({ page: 1, limit: 4 })
    expect(res.data).toHaveLength(4)
    expect(res.meta).toMatchObject({ page: 1, limit: 4, total: 10, totalPages: 3 })
  })

  it('q 로 검색한다', async () => {
    const res = await listPosts({ q: 'pinia' })
    expect(res.data).toHaveLength(1)
  })

  it('없는 글은 ApiError(404, NOT_FOUND) 로 구조화된다 (requestId 포함)', async () => {
    const err = await rejection(getPost(9999))
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 404, code: 'NOT_FOUND' })
    expect(err.requestId).toBeTruthy()
  })

  it('로그인 없이 작성하면 401', async () => {
    expect(await rejection(createPost({ title: 't', body: 'b' }))).toMatchObject({ status: 401 })
  })

  it('토큰을 붙이면 작성·수정·삭제가 된다 (삭제는 204)', async () => {
    configureApi({ getToken: () => 'token-1' })
    const created = await createPost({ title: '새 글', body: '내용' })
    expect(created.author.nickname).toBe('mina')
    expect((await updatePost(created.id, { title: '수정' })).title).toBe('수정')
    expect(await deletePost(created.id)).toBeNull()
    expect(await rejection(getPost(created.id))).toMatchObject({ status: 404 })
  })

  it('검증 실패는 VALIDATION_ERROR 와 fields 를 준다', async () => {
    configureApi({ getToken: () => 'token-1' })
    const err = await rejection(createPost({ title: ' ', body: '' }))
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(err.fields)).toEqual(['title', 'body'])
  })

  it('남의 글 수정은 403', async () => {
    configureApi({ getToken: () => 'token-2' }) // 1번 글의 작성자는 mina(1)
    expect(await rejection(updatePost(1, { title: 'x' }))).toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })

  it('로그인 상태에서 401 이 오면 onUnauthorized 를 부른다', async () => {
    const onUnauthorized = vi.fn()
    configureApi({ getToken: () => 'expired', onUnauthorized })
    await rejection(request('/api/auth/me'))
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('서버에 연결할 수 없으면 NETWORK 오류로 통일한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))
    expect(await rejection(request('/api/posts'))).toMatchObject({ status: 0, code: 'NETWORK' })
  })
})
