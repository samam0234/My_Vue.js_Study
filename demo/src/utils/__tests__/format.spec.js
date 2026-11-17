import { formatPrice, formatDate } from '../format.js'

describe('format', () => {
  it('가격에 천 단위 구분과 원을 붙인다', () => {
    expect(formatPrice(45000)).toBe('45,000원')
    expect(formatPrice(0)).toBe('0원')
  })

  it('ISO 문자열을 사람이 읽을 수 있는 날짜로 바꾼다', () => {
    expect(formatDate('2026-11-01T09:00:00')).toMatch(/2026/)
  })
})
