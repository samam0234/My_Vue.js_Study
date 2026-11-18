import { request } from './client'

export const summarize = (text: string) =>
  request<{ data: { summary: string } }>('/api/ai/summarize', {
    method: 'POST',
    body: { text },
  }).then((r) => r.data.summary)
