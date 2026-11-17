// study18: 게시판 API 를 AI 도구에 연결하는 읽기 전용 MCP 서버 (stdio).
// 주의: stdio 전송에서는 표준 출력이 프로토콜 통신 채널이다. console.log 를 쓰지 말고 console.error 를 쓴다.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = process.env.BOARD_API_BASE ?? 'http://localhost:8000'

const server = new McpServer({ name: 'board', version: '0.1.0' })

const textResult = (text) => ({ content: [{ type: 'text', text }] })
const errorResult = (text) => ({ isError: true, content: [{ type: 'text', text }] })

async function getJson(path) {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`API 오류 (HTTP ${res.status})`)
  return res.json()
}

// 도구는 읽기 전용(GET)만 만든다. 쓰기 도구는 사람의 확인 절차가 있을 때만 추가한다.
server.registerTool(
  'search_posts',
  {
    description:
      '게시판에서 제목·본문으로 게시글을 검색한다. 읽기 전용. 결과는 "#id 제목 (작성자, 댓글 수)" 목록이다.',
    inputSchema: {
      q: z.string().min(1).max(100).describe('검색어'),
      limit: z.number().int().min(1).max(20).default(5).describe('최대 결과 수'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ q, limit }) => {
    try {
      const { data } = await getJson(`/api/posts?${new URLSearchParams({ q, limit: String(limit) })}`)
      const lines = data.map((p) => `#${p.id} ${p.title} (${p.author.nickname}, 댓글 ${p.commentCount})`)
      return textResult(lines.join('\n') || '검색 결과 없음')
    } catch (e) {
      return errorResult(e.message)
    }
  },
)

server.registerTool(
  'get_post',
  {
    description: '게시글 한 건의 제목·작성자·본문을 가져온다. 읽기 전용. id 는 search_posts 결과의 #번호.',
    inputSchema: { id: z.number().int().positive().describe('게시글 id') },
    annotations: { readOnlyHint: true },
  },
  async ({ id }) => {
    try {
      const { data: p } = await getJson(`/api/posts/${id}`)
      return textResult(`# ${p.title}\n작성자: ${p.author.nickname} · ${p.createdAt}\n\n${p.body}`)
    } catch (e) {
      return errorResult(e.message)
    }
  },
)

await server.connect(new StdioServerTransport())
console.error('board MCP server running (stdio)')
