// 통합 테스트: App + 라우터 + Pinia + 실제 API 클라이언트 + 실제 개발 서버 (study9)
import { mountApp, signIn, field, button, settle } from '../test/helpers.js'

beforeEach(() => {
  vi.stubGlobal('alert', vi.fn())
  vi.stubGlobal('confirm', vi.fn(() => true))
})

describe('목록', () => {
  it('게시글을 카드로 보여 준다 (최신순, 한 페이지 9개)', async () => {
    const { wrapper } = await mountApp('/')
    expect(wrapper.text()).toContain('템플릿 문법 정리')
    expect(wrapper.findAll('a[href^="/posts/"]')).toHaveLength(9)
  })

  it('?q= 로 들어오면 검색어가 복원되고 결과가 좁혀진다', async () => {
    const { wrapper } = await mountApp('/?q=pinia')
    expect(wrapper.get('input[type="search"]').element.value).toBe('pinia')
    expect(wrapper.findAll('h3')).toHaveLength(1)
  })

  it('비로그인 즐겨찾기는 안내만 하고, 로그인하면 된다', async () => {
    const guest = await mountApp('/')
    await guest.wrapper.get('button[aria-label="즐겨찾기"]').trigger('click')
    expect(alert).toHaveBeenCalled()

    const { wrapper } = await mountApp('/', await signIn())
    await wrapper.get('button[aria-label="즐겨찾기"]').trigger('click')
    expect(wrapper.findAll('button[aria-label="즐겨찾기 해제"]')).toHaveLength(1)
  })
})

describe('상세·글 관리', () => {
  it('글과 댓글을 동시에 불러와 보여 준다', async () => {
    const { wrapper } = await mountApp('/posts/1')
    expect(wrapper.get('h2').text()).toBe('Vue 3 반응형 정리')
    expect(wrapper.text()).toContain('댓글 0')
  })

  it('없는 글은 안내를 보여 준다', async () => {
    const { wrapper } = await mountApp('/posts/9999')
    expect(wrapper.get('[data-testid="post-not-found"]').exists()).toBe(true)
  })

  it('작성자 본인에게만 수정·삭제 버튼이 보인다 (2번 글의 작성자는 joon)', async () => {
    const other = await mountApp('/posts/2', await signIn('mina@example.com'))
    expect(other.wrapper.text()).not.toContain('수정')
    other.wrapper.unmount()
    const owner = await mountApp('/posts/2', await signIn('joon@example.com'))
    expect(owner.wrapper.text()).toContain('수정')
  })

  it('삭제하면 목록으로 돌아간다', async () => {
    const { wrapper, router } = await mountApp('/posts/1', await signIn())
    await button(wrapper, '삭제').trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('post-list')
    expect(wrapper.text()).not.toContain('Vue 3 반응형 정리')
  })

  it('댓글을 쓰면 목록에 나타난다', async () => {
    const { wrapper } = await mountApp('/posts/2', await signIn())
    await wrapper.get('#comment-body').setValue('좋은 글이에요')
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(wrapper.text()).toContain('좋은 글이에요')
    expect(wrapper.text()).toContain('댓글 1')
  })

  it('글쓰기: 비어 있으면 필드 오류, 채우면 상세로 이동한다', async () => {
    const { wrapper, router } = await mountApp('/posts/new', await signIn())
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(wrapper.text()).toContain('제목은 1~200자')

    await field(wrapper, '제목').setValue('새로 쓴 글')
    await field(wrapper, '내용').setValue('본문')
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(router.currentRoute.value.name).toBe('post-detail')
    expect(wrapper.get('h2').text()).toBe('새로 쓴 글')
  })

  it('수정 화면은 기존 값으로 채워지고 저장하면 반영된다', async () => {
    const { wrapper } = await mountApp('/posts/1/edit', await signIn())
    expect(field(wrapper, '제목').element.value).toBe('Vue 3 반응형 정리')
    await field(wrapper, '제목').setValue('고친 제목')
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(wrapper.get('h2').text()).toBe('고친 제목')
  })
})

describe('로그인·가드', () => {
  it('보호된 화면은 로그인 후 원래 화면으로 돌아온다 (redirect)', async () => {
    const { wrapper, router } = await mountApp('/posts/new')
    expect(router.currentRoute.value.name).toBe('login')
    await field(wrapper, '이메일').setValue('mina@example.com')
    await field(wrapper, '비밀번호').setValue('password123')
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(router.currentRoute.value.name).toBe('post-new')
    expect(wrapper.get('[data-testid="current-user"]').text()).toContain('mina')
  })

  it('비밀번호가 틀리면 안내가 나온다', async () => {
    const { wrapper } = await mountApp('/login')
    await field(wrapper, '이메일').setValue('mina@example.com')
    await field(wrapper, '비밀번호').setValue('wrong-password')
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(wrapper.text()).toContain('올바르지 않습니다')
  })

  it('이미 로그인했으면 로그인 화면 대신 목록으로 간다', async () => {
    const { router } = await mountApp('/login', await signIn())
    expect(router.currentRoute.value.name).toBe('post-list')
  })

  it('로그아웃하면 보호된 화면에 들어갈 수 없다', async () => {
    const { wrapper, router } = await mountApp('/', await signIn())
    await button(wrapper, '로그아웃').trigger('click')
    await settle()
    await router.push('/posts/new')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('만료된 토큰으로 보호된 API 를 부르면 세션이 정리된다 (401)', async () => {
    const ctx = await signIn()
    ctx.auth.token = 'expired'
    const { wrapper } = await mountApp('/posts/2', ctx)
    await wrapper.get('#comment-body').setValue('댓글')
    await wrapper.get('form').trigger('submit')
    await settle()
    expect(ctx.auth.isLoggedIn).toBe(false)
  })
})

describe('회원가입', () => {
  const fill = async (wrapper, email, confirm = 'password123') => {
    await field(wrapper, '이메일').setValue(email)
    await field(wrapper, '닉네임').setValue('새사람')
    await field(wrapper, '비밀번호').setValue('password123')
    await field(wrapper, '비밀번호 확인').setValue(confirm)
    await wrapper.get('form').trigger('submit')
    await settle()
  }

  it('중복 이메일은 서버 오류가 해당 필드 아래에 나온다', async () => {
    const { wrapper } = await mountApp('/signup')
    await fill(wrapper, 'mina@example.com')
    expect(wrapper.text()).toContain('이미 사용 중인 이메일입니다')
  })

  it('비밀번호 확인이 다르면 요청 없이 오류를 보여 준다', async () => {
    const { wrapper, router } = await mountApp('/signup')
    await fill(wrapper, 'new@example.com', 'different')
    expect(wrapper.text()).toContain('비밀번호가 일치하지 않습니다')
    expect(router.currentRoute.value.name).toBe('signup')
  })

  it('성공하면 로그인 화면으로 이동한다', async () => {
    const { wrapper, router } = await mountApp('/signup')
    await fill(wrapper, 'new@example.com')
    expect(router.currentRoute.value.name).toBe('login')
  })
})

it('없는 주소는 404 화면', async () => {
  const { wrapper } = await mountApp('/no/such/page')
  expect(wrapper.get('[data-testid="not-found"]').text()).toContain('404')
})
