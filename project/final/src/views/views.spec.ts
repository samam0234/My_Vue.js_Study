// 통합 테스트: App + 라우터 + Pinia + 실제 API 클라이언트 + MSW 가짜 서버를 함께 쓴다 (study15).
import type { VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { mountApp, signIn, createTestPinia, settle } from '@/test/helpers'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** label 텍스트로 입력 요소를 찾는다 (사용자가 보는 방식). */
function field(wrapper: VueWrapper, label: string) {
  const l = wrapper.findAll('label').find((el) => el.text() === label)
  if (!l) throw new Error(`label "${label}" 을 찾지 못했습니다.`)
  return wrapper.get(`[id="${l.attributes('for')}"]`)
}

const button = (wrapper: VueWrapper, text: string) => {
  const b = wrapper.findAll('button').find((el) => el.text().includes(text))
  if (!b) throw new Error(`button "${text}" 을 찾지 못했습니다.`)
  return b
}

beforeEach(() => {
  vi.stubGlobal('alert', vi.fn())
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  )
})

describe('목록 화면', () => {
  it('API 의 게시글을 카드로 보여 준다', async () => {
    const { wrapper } = await mountApp('/')
    expect(wrapper.text()).toContain('보안 점검표') // 최신순 첫 글
    expect(wrapper.findAll('a[href^="/posts/"]')).toHaveLength(9) // 한 페이지 9개
  })

  it('서버 오류면 오류 메시지·요청 번호·다시 시도 버튼을 보여 주고, 복구되면 목록이 나온다', async () => {
    let fail = true
    server.use(
      http.get('*/api/posts', () =>
        fail
          ? HttpResponse.json(
              { error: { code: 'INTERNAL', message: '서버 오류', requestId: 'req-500' } },
              { status: 500 },
            )
          : HttpResponse.json({
              data: [],
              meta: { page: 1, limit: 9, total: 0, totalPages: 1 },
            }),
      ),
    )
    const { wrapper } = await mountApp('/')
    expect(wrapper.text()).toContain('서버 오류')
    expect(wrapper.text()).toContain('req-500')

    fail = false
    await button(wrapper, '다시 시도').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('조건에 맞는 게시글이 없습니다')
  })

  it('검색어를 입력하면 결과가 좁혀지고 URL 에도 남는다', async () => {
    const { wrapper, router } = await mountApp('/')
    await wrapper.get('input[type="search"]').setValue('pinia')
    await sleep(400) // 디바운스(300ms) 대기
    await settle()

    expect(wrapper.text()).toContain('Pinia 로 로그인 공유')
    expect(wrapper.text()).not.toContain('Vue 3 반응형 정리')
    expect(router.currentRoute.value.query.q).toBe('pinia')
  })

  it('?q= 로 들어오면 검색어가 입력창에 복원된다', async () => {
    const { wrapper } = await mountApp('/?q=docker')
    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('docker')
    expect(wrapper.text()).toContain('Docker 로 Vue 배포')
  })

  it('로그인하지 않고 즐겨찾기를 누르면 안내만 하고 저장하지 않는다', async () => {
    const { wrapper } = await mountApp('/')
    await wrapper.get('button[aria-label="즐겨찾기"]').trigger('click')
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('로그인'))
    expect(wrapper.find('button[aria-label="즐겨찾기 해제"]').exists()).toBe(false)
  })

  it('로그인하면 즐겨찾기 할 수 있고, 즐겨찾기만 보기로 걸러진다', async () => {
    const ctx = await signIn()
    const { wrapper } = await mountApp('/', ctx)

    await wrapper.get('button[aria-label="즐겨찾기"]').trigger('click')
    expect(wrapper.findAll('button[aria-label="즐겨찾기 해제"]')).toHaveLength(1)

    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.findAll('h3')).toHaveLength(1)
  })
})

describe('상세 화면', () => {
  it('글과 댓글을 보여 준다', async () => {
    const { wrapper } = await mountApp('/posts/1')
    expect(wrapper.get('h2').text()).toBe('Vue 3 반응형 정리')
    expect(wrapper.text()).toContain('정리가 깔끔하네요.')
  })

  it('없는 글이면 안내와 목록 링크를 보여 준다 (오류 화면이 아니다)', async () => {
    const { wrapper } = await mountApp('/posts/9999')
    expect(wrapper.get('[data-testid="post-not-found"]').text()).toContain('찾을 수 없습니다')
  })

  it('작성자 본인에게만 수정·삭제 버튼이 보인다', async () => {
    // 2번 글의 작성자는 joon (댓글이 없어 '삭제' 버튼은 글 삭제뿐이다)
    const other = await mountApp('/posts/2', await signIn('mina@example.com'))
    expect(other.wrapper.text()).not.toContain('삭제')
    expect(other.wrapper.text()).not.toContain('수정')
    other.wrapper.unmount()

    const owner = await mountApp('/posts/2', await signIn('joon@example.com'))
    expect(owner.wrapper.text()).toContain('수정')
    expect(owner.wrapper.text()).toContain('삭제')
  })

  it('삭제하면 목록으로 돌아가고 글이 사라진다', async () => {
    const { wrapper, router } = await mountApp('/posts/1', await signIn())
    await button(wrapper, '삭제').trigger('click')
    await settle()

    expect(router.currentRoute.value.name).toBe('post-list')
    expect(wrapper.text()).not.toContain('Vue 3 반응형 정리')
  })

  it('서버가 403 을 주면 로그인 화면이 아니라 현재 화면에 안내를 보여 준다', async () => {
    server.use(
      http.delete('*/api/posts/1', () =>
        HttpResponse.json(
          { error: { code: 'FORBIDDEN', message: '본인이 쓴 글만 삭제할 수 있습니다.' } },
          { status: 403 },
        ),
      ),
    )
    const { wrapper, router } = await mountApp('/posts/1', await signIn())
    await button(wrapper, '삭제').trigger('click')
    await settle()

    expect(router.currentRoute.value.name).toBe('post-detail')
    expect(wrapper.get('[role="alert"]').text()).toContain('본인이 쓴 글만')
  })

  it('댓글을 쓰면 즉시 화면에 나타나고 서버에도 저장된다 (낙관적 업데이트)', async () => {
    const { wrapper } = await mountApp('/posts/2', await signIn())
    await wrapper.get('#comment-body').setValue('좋은 글이에요')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('좋은 글이에요')
    expect(wrapper.text()).toContain('댓글 1')
  })

  it('댓글 저장이 실패하면 화면에서 되돌리고 입력을 복원한다 (롤백)', async () => {
    server.use(
      http.post('*/api/posts/2/comments', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'x' } }, { status: 500 }),
      ),
    )
    const { wrapper } = await mountApp('/posts/2', await signIn())
    await wrapper.get('#comment-body').setValue('실패할 댓글')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).not.toContain('실패할 댓글') // 댓글 목록에 남지 않는다
    expect((wrapper.get('#comment-body').element as HTMLTextAreaElement).value).toBe('실패할 댓글')
    expect(wrapper.text()).toContain('댓글을 저장하지 못했습니다')
  })

  it('로그인한 사용자는 AI 요약을 스트리밍으로 받는다', async () => {
    const { wrapper } = await mountApp('/posts/1', await signIn())
    await button(wrapper, 'AI 요약').trigger('click')
    await sleep(900)
    await settle()

    expect(wrapper.get('[data-testid="ai-summary"]').text()).toContain('[목 요약]')
  })

  it('로그인하지 않으면 AI 요약 버튼이 없다', async () => {
    const { wrapper } = await mountApp('/posts/1')
    expect(wrapper.text()).not.toContain('AI 요약')
  })
})

describe('로그인·가드', () => {
  it('로그인하지 않고 글쓰기에 접근하면 로그인 화면으로 가고, 로그인하면 원래 화면으로 돌아온다', async () => {
    const { wrapper, router } = await mountApp('/posts/new')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/posts/new')

    await field(wrapper, '이메일').setValue('mina@example.com')
    await field(wrapper, '비밀번호').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await settle()
    await settle()

    expect(router.currentRoute.value.name).toBe('post-new')
    expect(wrapper.get('[data-testid="current-user"]').text()).toContain('mina')
  })

  it('비밀번호가 틀리면 안내 문구를 보여 주고 로그인 화면에 머문다', async () => {
    const { wrapper, router } = await mountApp('/login')
    await field(wrapper, '이메일').setValue('mina@example.com')
    await field(wrapper, '비밀번호').setValue('wrong-password')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('이메일 또는 비밀번호가 올바르지 않습니다')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('형식이 잘못되면 요청 없이 필드 오류를 보여 준다', async () => {
    const { wrapper } = await mountApp('/login')
    await field(wrapper, '이메일').setValue('abc')
    await field(wrapper, '비밀번호').setValue('short')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('올바른 이메일 형식이 아닙니다')
    expect(wrapper.text()).toContain('8자 이상')
  })

  it('운영 빌드에는 개발용 계정 채우기 버튼이 없다 (VITE_ENABLE_MOCK=false)', async () => {
    const { wrapper } = await mountApp('/login')
    expect(wrapper.text()).not.toContain('여기를 눌러 채우기')
  })

  it('이미 로그인했으면 로그인 화면 대신 목록으로 보낸다', async () => {
    const { router } = await mountApp('/login', await signIn())
    expect(router.currentRoute.value.name).toBe('post-list')
  })

  it('로그아웃하면 헤더가 즉시 바뀌고 보호된 화면에 들어갈 수 없다', async () => {
    const { wrapper, router } = await mountApp('/', await signIn())
    await button(wrapper, '로그아웃').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('로그인하지 않음')
    await router.push('/posts/new')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('만료된 토큰으로 보호된 API 를 부르면 세션이 정리된다 (401)', async () => {
    const ctx = await signIn()
    ctx.auth.token = 'expired-token' // 서버가 모르는 토큰
    const { wrapper } = await mountApp('/posts/2', ctx)
    await wrapper.get('#comment-body').setValue('댓글')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(ctx.auth.isLoggedIn).toBe(false)
  })
})

describe('회원가입', () => {
  it('중복 이메일이면 서버 오류를 해당 필드 아래에 보여 준다', async () => {
    const { wrapper } = await mountApp('/signup')
    await field(wrapper, '이메일').setValue('mina@example.com')
    await field(wrapper, '닉네임').setValue('새사람')
    await field(wrapper, '비밀번호').setValue('password123')
    await field(wrapper, '비밀번호 확인').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('이미 사용 중인 이메일입니다')
  })

  it('비밀번호 확인이 다르면 요청하지 않고 오류를 보여 준다', async () => {
    const { wrapper, router } = await mountApp('/signup')
    await field(wrapper, '이메일').setValue('new@example.com')
    await field(wrapper, '닉네임').setValue('새사람')
    await field(wrapper, '비밀번호').setValue('password123')
    await field(wrapper, '비밀번호 확인').setValue('different')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('비밀번호가 일치하지 않습니다')
    expect(router.currentRoute.value.name).toBe('signup')
  })

  it('가입에 성공하면 로그인 화면으로 이동한다', async () => {
    const { wrapper, router } = await mountApp('/signup')
    await field(wrapper, '이메일').setValue('new@example.com')
    await field(wrapper, '닉네임').setValue('새사람')
    await field(wrapper, '비밀번호').setValue('password123')
    await field(wrapper, '비밀번호 확인').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(router.currentRoute.value.name).toBe('login')
  })
})

describe('글쓰기·수정', () => {
  it('제목·내용이 비어 있으면 서버 호출 없이 오류를 보여 준다', async () => {
    const { wrapper, router } = await mountApp('/posts/new', await signIn())
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('제목은 1~200자')
    expect(wrapper.text()).toContain('내용을 입력하세요')
    expect(router.currentRoute.value.name).toBe('post-new')
  })

  it('작성하면 상세 화면으로 이동해 새 글을 보여 준다', async () => {
    const { wrapper, router } = await mountApp('/posts/new', await signIn())
    await field(wrapper, '제목').setValue('새로 쓴 글')
    await field(wrapper, '내용').setValue('본문입니다')
    await field(wrapper, '태그 (쉼표로 구분)').setValue('a, b')
    await wrapper.get('form').trigger('submit')
    await settle()
    await settle()

    expect(router.currentRoute.value.name).toBe('post-detail')
    expect(wrapper.get('h2').text()).toBe('새로 쓴 글')
    expect(wrapper.text()).toContain('#a')
  })

  it('서버의 검증 오류(fields)를 해당 필드 아래에 보여 준다', async () => {
    server.use(
      http.post('*/api/posts', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: '입력값을 확인하세요.',
              fields: { title: ['금지된 단어가 있습니다.'] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { wrapper } = await mountApp('/posts/new', await signIn())
    await field(wrapper, '제목').setValue('제목')
    await field(wrapper, '내용').setValue('내용')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('금지된 단어가 있습니다.')
  })

  it('수정 화면은 기존 값으로 채워지고, 저장하면 상세에 반영된다', async () => {
    const { wrapper, router } = await mountApp('/posts/1/edit', await signIn())
    expect((field(wrapper, '제목').element as HTMLInputElement).value).toBe('Vue 3 반응형 정리')

    await field(wrapper, '제목').setValue('고친 제목')
    await wrapper.get('form').trigger('submit')
    await settle()
    await settle()

    expect(router.currentRoute.value.name).toBe('post-detail')
    expect(wrapper.get('h2').text()).toBe('고친 제목')
  })

  it('남의 글 수정 화면에 들어가면 상세로 돌려보낸다', async () => {
    const { router } = await mountApp('/posts/1/edit', await signIn('joon@example.com'))
    expect(router.currentRoute.value.name).toBe('post-detail')
  })
})

describe('기타', () => {
  it('없는 주소는 404 화면을 보여 준다', async () => {
    const { wrapper } = await mountApp('/no/such/page')
    expect(wrapper.get('[data-testid="not-found"]').text()).toContain('404')
  })

  it('복원(restore) 중인 토큰이 있으면 헤더에 사용자가 나타난다', async () => {
    const ctx = createTestPinia()
    localStorage.setItem('mini-board:token', 'mock-token-2')
    ctx.auth.token = 'mock-token-2'
    await ctx.auth.restore()
    const { wrapper } = await mountApp('/', ctx)
    expect(wrapper.get('[data-testid="current-user"]').text()).toContain('joon')
  })
})
