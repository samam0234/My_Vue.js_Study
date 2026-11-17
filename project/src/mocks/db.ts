// 백엔드 없이 개발·테스트·E2E 를 하기 위한 메모리 DB (공통 API 스펙 v1 데이터 모양).
import type { Comment, Post, User } from '@/types/api'

export interface StoredUser extends User {
  password: string
}

interface Db {
  users: StoredUser[]
  posts: Post[]
  comments: Comment[]
  nextUserId: number
  nextPostId: number
  nextCommentId: number
}

const HOUR = 60 * 60 * 1000

function seed(): Db {
  const users: StoredUser[] = [
    { id: 1, email: 'mina@example.com', nickname: 'mina', password: 'password123' },
    { id: 2, email: 'joon@example.com', nickname: 'joon', password: 'password123' },
  ]
  const topics = [
    ['Vue 3 반응형 정리', 'ref 와 reactive 의 차이를 예제로 정리했습니다.'],
    ['Vue Router 목록과 상세', '동적 파라미터와 params 감시 방법을 다룹니다.'],
    ['폼 검증 패턴', 'touched 와 submitted 로 오류 노출 시점을 제어합니다.'],
    ['Pinia 로 로그인 공유', '헤더와 목록이 같은 스토어를 구독하게 만듭니다.'],
    ['fetch 와 오류 처리', 'res.ok 를 직접 확인해야 하는 이유를 설명합니다.'],
    ['Vitest 시작하기', '스토어와 컴포넌트를 테스트하는 첫걸음.'],
    ['Vite 환경변수', 'VITE_ 접두어와 빌드 시점 주입에 대해.'],
    ['SPA 배포와 fallback', '새로고침 404 를 막는 서버 설정.'],
    ['TypeScript 도입기', 'API 응답 타입부터 점진적으로 전환했습니다.'],
    ['Docker 로 Vue 배포', '멀티 스테이지 빌드와 Nginx 설정.'],
    ['성능 측정 기록', 'Lighthouse 와 번들 분석으로 병목 찾기.'],
    ['보안 점검표', 'XSS, 토큰 보관, 의존성 점검 항목.'],
  ]
  const now = Date.now()
  const posts: Post[] = topics.map(([title, body], i) => ({
    id: i + 1,
    title,
    body,
    tags: i % 2 === 0 ? ['vue'] : ['study', 'frontend'],
    author: { id: (i % 2) + 1, nickname: users[i % 2].nickname },
    commentCount: 0,
    createdAt: new Date(now - (topics.length - i) * HOUR).toISOString(),
    updatedAt: new Date(now - (topics.length - i) * HOUR).toISOString(),
  }))
  const comments: Comment[] = [
    {
      id: 1,
      postId: 1,
      body: '정리가 깔끔하네요.',
      author: { id: 2, nickname: 'joon' },
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    },
  ]
  posts[0].commentCount = 1
  return {
    users,
    posts,
    comments,
    nextUserId: 3,
    nextPostId: topics.length + 1,
    nextCommentId: 2,
  }
}

export let db: Db = seed()

export function resetDb() {
  db = seed()
}
