import { ref } from 'vue'
import { env } from '@/config/env'
import { isAbortError } from '@/api/abort'

/**
 * AI 요약을 SSE 로 받아 글자가 생성되는 대로 이어 붙인다 (study18).
 * EventSource 는 POST·헤더를 쓸 수 없어서 fetch + ReadableStream 으로 읽는다.
 */
export function useStreamSummary(getToken: () => string | null) {
  const text = ref('')
  const loading = ref(false)
  const error = ref('')
  let controller: AbortController | null = null

  async function start(body: string) {
    controller?.abort() // 이전 요청 취소
    const current = new AbortController()
    controller = current
    text.value = ''
    error.value = ''
    loading.value = true

    try {
      const token = getToken()
      const res = await fetch(`${env.apiBaseUrl}/api/ai/summarize/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: body }),
        signal: current.signal,
      })
      if (!res.ok || !res.body) {
        throw new Error(res.status === 401 ? '로그인 후 이용할 수 있습니다.' : `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        // stream: true — 한글이 조각 경계에서 잘려도 올바르게 디코딩한다
        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split('\n\n')
        buffer = events.pop() ?? '' // 마지막 조각은 불완전할 수 있어 다음 루프로 이월
        for (const ev of events) {
          const data = ev.replace(/^data: /, '')
          if (data === '[DONE]') return
          const json = JSON.parse(data) as { text?: string; error?: string }
          if (json.error) throw new Error(json.error)
          text.value += json.text ?? ''
        }
      }
    } catch (err) {
      if (isAbortError(err)) return
      error.value = err instanceof Error ? err.message : '요약에 실패했습니다.'
    } finally {
      if (controller === current) loading.value = false
    }
  }

  const stop = () => controller?.abort()

  return { text, loading, error, start, stop }
}
