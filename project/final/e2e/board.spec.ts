import { test, expect, type Page } from '@playwright/test'

// 사용자가 보는 방식(label, role, text)으로 요소를 고른다. 임의의 sleep 없이 auto-wait 단언을 쓴다.
async function login(page: Page, email = 'mina@example.com', password = 'password123') {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByTestId('current-user')).toBeVisible()
}

test.describe('열람 (비로그인)', () => {
  test('E1 목록과 상세를 열람할 수 있다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '보안 점검표' })).toBeVisible()

    await page.getByRole('link', { name: /Docker 로 Vue 배포/ }).click()
    await expect(page).toHaveURL(/\/posts\/10$/)
    await expect(page.getByRole('heading', { level: 2, name: 'Docker 로 Vue 배포' })).toBeVisible()
  })

  test('E8 상세 주소로 직접 들어가거나 새로고침해도 열린다 (SPA fallback)', async ({ page }) => {
    await page.goto('/posts/3')
    await expect(page.getByRole('heading', { level: 2, name: '폼 검증 패턴' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: '폼 검증 패턴' })).toBeVisible()
  })

  test('없는 주소는 404 화면을 보여 준다', async ({ page }) => {
    await page.goto('/no/such/page')
    await expect(page.getByTestId('not-found')).toContainText('404')
  })

  test('검색어는 URL 에 남고 결과가 좁혀진다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('searchbox').fill('pinia')
    await expect(page).toHaveURL(/q=pinia/)
    await expect(page.getByRole('heading', { name: 'Pinia 로 로그인 공유' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '보안 점검표' })).toHaveCount(0)
  })

  test('E6 서버 오류가 나면 오류 화면과 요청 번호, 다시 시도 버튼을 보여 준다', async ({
    page,
  }) => {
    // 목 서버: q=__error__ 이면 500 을 돌려준다 (src/mocks/handlers.ts)
    await page.goto('/?q=__error__')
    await expect(page.getByRole('alert')).toContainText('서버 오류')
    await expect(page.getByRole('alert')).toContainText('요청 번호')
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  })
})

test.describe('인증', () => {
  test('E2 글쓰기에 접근하면 로그인으로 가고, 로그인하면 원래 화면으로 돌아온다', async ({
    page,
  }) => {
    await page.goto('/posts/new')
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)posts(%2F|\/)new/)

    await page.getByLabel('이메일').fill('mina@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page).toHaveURL(/\/posts\/new$/)
    await expect(page.getByRole('heading', { name: '글쓰기' })).toBeVisible()
  })

  test('E3 새로고침해도 로그인이 유지된다', async ({ page }) => {
    await login(page)
    await page.reload()
    await expect(page.getByTestId('current-user')).toContainText('mina')
    expect(await page.evaluate(() => localStorage.getItem('mini-board:token'))).toBeTruthy()
  })

  test('로그아웃하면 토큰이 지워지고 보호된 화면에 들어갈 수 없다', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: '로그아웃' }).click()
    await expect(page.getByText('로그인하지 않음')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('mini-board:token'))).toBeNull()

    await page.goto('/posts/new')
    await expect(page).toHaveURL(/\/login/)
  })

  test('비밀번호가 틀리면 안내 문구가 나온다', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('mina@example.com')
    await page.getByLabel('비밀번호').fill('wrong-password')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByRole('alert')).toContainText('올바르지 않습니다')
  })

  test('위조된 토큰은 새로고침 때 정리되어 로그아웃 상태가 된다', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mini-board:token', 'forged'))
    await page.goto('/')
    await expect(page.getByText('로그인하지 않음')).toBeVisible()
  })

  test('회원가입 후 그 계정으로 로그인할 수 있다', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('이메일').fill('e2e@example.com')
    await page.getByLabel('닉네임').fill('e2e')
    await page.getByLabel('비밀번호', { exact: true }).fill('password123')
    await page.getByLabel('비밀번호 확인').fill('password123')
    await page.getByRole('button', { name: '가입하기' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await page.getByLabel('이메일').fill('e2e@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByTestId('current-user')).toContainText('e2e')
  })
})

test.describe('글 CRUD', () => {
  test('E4 작성 → 상세 → 수정 → 삭제', async ({ page }) => {
    await login(page)

    await page.getByRole('link', { name: '글쓰기' }).click()
    await expect(page.getByRole('heading', { level: 2, name: '글쓰기' })).toBeVisible()
    await page.getByLabel('제목', { exact: true }).fill('E2E 글')
    await page.getByLabel('내용').fill('E2E 본문입니다')
    await page.getByLabel('태그 (쉼표로 구분)').fill('e2e, test')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'E2E 글' })).toBeVisible()
    await expect(page.getByText('#e2e')).toBeVisible()

    await page.getByRole('link', { name: '수정' }).click()
    await expect(page.getByLabel('제목', { exact: true })).toHaveValue('E2E 글')
    await page.getByLabel('제목', { exact: true }).fill('E2E 글 (수정)')
    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'E2E 글 (수정)' })).toBeVisible()

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: '삭제' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'E2E 글 (수정)' })).toHaveCount(0)
  })

  test('제목을 비우면 저장 전에 필드 오류가 보인다', async ({ page }) => {
    await login(page)
    await page.goto('/posts/new')
    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.getByText('제목은 1~200자로 입력하세요.')).toBeVisible()
  })

  test('E5 남의 글에는 수정·삭제 버튼이 없다', async ({ page }) => {
    await login(page, 'mina@example.com')
    await page.goto('/posts/2') // 2번 글의 작성자는 joon (댓글이 없어 '삭제' 는 글 삭제 버튼뿐)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Vue Router 목록과 상세' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: '수정' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toHaveCount(0)
  })

  test('댓글을 쓰면 바로 보인다', async ({ page }) => {
    await login(page)
    await page.goto('/posts/2')
    await page.getByLabel('댓글 내용').fill('E2E 댓글')
    await page.getByRole('button', { name: '댓글 등록' }).click()
    await expect(page.getByText('E2E 댓글')).toBeVisible()
    await expect(page.getByRole('heading', { name: '댓글 1' })).toBeVisible()
  })
})

test.describe('AI 요약', () => {
  test('E7 로그인하면 요약이 스트리밍으로 나타난다', async ({ page }) => {
    await login(page)
    await page.goto('/posts/1')
    await page.getByRole('button', { name: /AI 요약/ }).click()
    await expect(page.getByTestId('ai-summary')).toContainText('[목 요약]')
    await expect(page.getByTestId('ai-summary')).toContainText('내용입니다.')
  })

  test('비로그인에는 AI 요약 버튼이 없다', async ({ page }) => {
    await page.goto('/posts/1')
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible()
    await expect(page.getByRole('button', { name: /AI 요약/ })).toHaveCount(0)
  })
})

test.describe('모바일 @mobile', () => {
  test('좁은 화면에서도 가로 스크롤이 생기지 않는다 @mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '보안 점검표' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
