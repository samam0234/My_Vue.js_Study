/** 사용자가 입력한 URL 에서 http(s) 만 허용한다 (javascript: 같은 프로토콜 차단, study16). */
export function safeHref(input: string): string {
  try {
    const url = new URL(input)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'
  } catch {
    return '#'
  }
}
