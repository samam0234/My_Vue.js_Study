import { safeHref } from './safeUrl'
import { formatDate, fromNow } from './format'

describe('safeHref', () => {
  it('http(s) 주소만 허용한다', () => {
    expect(safeHref('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
    expect(safeHref('http://example.com')).toBe('http://example.com/')
  })

  it('javascript: 같은 위험한 프로토콜과 잘못된 입력은 # 으로 바꾼다', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#')
    expect(safeHref('data:text/html,<script>1</script>')).toBe('#')
    expect(safeHref('not a url')).toBe('#')
  })
})

describe('format', () => {
  it('절대 시간을 YYYY.MM.DD HH:mm 으로 만든다', () => {
    expect(formatDate('2026-11-01T09:00:00')).toMatch(/^2026\.11\.01 \d{2}:\d{2}$/)
  })

  it('상대 시간을 한국어로 만든다', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(fromNow(threeHoursAgo)).toBe('3시간 전')
  })
})
