import { signIn, rejection } from '@/test/helpers'
import { listPosts, getPost, createPost, updatePost, deletePost } from './posts'
import { listComments, createComment, deleteComment } from './comments'
import { ApiError, configureApi } from './client'

describe('posts / comments API (공통 API 스펙 v1)', () => {
  it('목록은 { data, meta } 와 페이지 정보를 돌려준다', async () => {
    const res = await listPosts({ page: 1, limit: 5 })
    expect(res.data).toHaveLength(5)
    expect(res.meta).toMatchObject({ page: 1, limit: 5, total: 12, totalPages: 3 })
  })

  it('q 로 제목·본문을 검색한다', async () => {
    const res = await listPosts({ q: 'pinia' })
    expect(res.data.length).toBeGreaterThan(0)
    expect(res.data.every((p) => `${p.title}${p.body}`.toLowerCase().includes('pinia'))).toBe(true)
    expect(res.meta.q).toBe('pinia')
  })

  it('없는 글은 404 NOT_FOUND', async () => {
    await expect(getPost(9999)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  it('로그인 없이 작성하면 401', async () => {
    await expect(createPost({ title: 't', body: 'b' })).rejects.toMatchObject({ status: 401 })
  })

  it('로그인하면 작성·수정·삭제할 수 있다 (작성 후 목록 캐시가 무효화된다)', async () => {
    await signIn()
    const before = await listPosts({ limit: 50 })

    const created = await createPost({ title: '새 글', body: '내용', tags: ['a'] })
    expect(created.author.nickname).toBe('mina')

    const after = await listPosts({ limit: 50 })
    expect(after.meta.total).toBe(before.meta.total + 1)

    const updated = await updatePost(created.id, { title: '수정됨' })
    expect(updated.title).toBe('수정됨')
    expect((await getPost(created.id)).title).toBe('수정됨')

    await deletePost(created.id)
    await expect(getPost(created.id)).rejects.toMatchObject({ status: 404 })
  })

  it('검증 실패는 VALIDATION_ERROR 와 필드별 메시지를 준다', async () => {
    await signIn()
    const err = await rejection(createPost({ title: '   ', body: '' }))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(err.fields ?? {})).toEqual(['title', 'body'])
  })

  it('남의 글을 수정·삭제하면 403 FORBIDDEN', async () => {
    await signIn('joon@example.com') // 1번 글의 작성자는 mina
    await expect(updatePost(1, { title: 'x' })).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    await expect(deletePost(1)).rejects.toMatchObject({ status: 403 })
  })

  it('댓글을 쓰면 목록의 commentCount 가 늘고, 삭제하면 줄어든다', async () => {
    await signIn()
    const comment = await createComment(2, '첫 댓글')
    expect((await listComments(2)).map((c) => c.id)).toContain(comment.id)
    expect((await getPost(2)).commentCount).toBe(1)

    await deleteComment(comment.id)
    expect((await getPost(2)).commentCount).toBe(0)
  })

  it('토큰이 없으면 댓글을 쓸 수 없다 (401)', async () => {
    configureApi({ getToken: () => null })
    await expect(createComment(1, 'x')).rejects.toMatchObject({ status: 401 })
  })
})
