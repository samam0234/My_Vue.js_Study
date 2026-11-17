# midpoint — 중간 응용: 게시판 + 로그인 서비스

> 🎯 **목표**: study0~10에서 배운 Vue 기능**만으로** 실제 백엔드 API에 연결된 "게시판 + 로그인" 서비스를 처음부터 끝까지 완성한다.

- 이전: [study10](./study10.md) 기초 구간 총정리
- 다음: [study11](./study11.md) 심화 구간
- 출발점: 이미 있는 [`project/`](./project) (JSONPlaceholder + 가상 로그인, [studyFinal.md](./studyFinal.md)에 정리)를 **실제 API 버전으로 승격**한다.
- 새 라이브러리 금지 규칙: 사용 가능한 것은 `vue`, `vue-router`, `pinia`, `vite`, `vitest`, `@vue/test-utils`뿐. (axios, UI 라이브러리, TypeScript는 심화 구간에서)
- 이 문서의 코드는 **저장소에 아직 반영하지 않은 구현 계획**입니다.

---

## 1. 목표

| 구분 | 내용 |
|---|---|
| 서비스 | **Mini Board** — 회원가입/로그인한 사용자가 글을 쓰고, 목록·검색·상세·댓글을 보는 게시판 |
| 백엔드 | 「공통 API 스펙 v1」을 따르는 서버 (예: `http://localhost:8000`). 프론트는 이 스펙만 안다 |
| 성공 기준 | ① 새로고침해도 로그인 유지 ② 로그인 없이 작성 화면 접근 불가 ③ 남의 글 수정·삭제 불가(403 안내) ④ 오류 시 화면이 깨지지 않음 ⑤ 핵심 로직 자동 테스트 통과 ⑥ `build` + `preview` + 정적 배포 성공 |

### 사용하는 study 범위 (동원 지도)

| 기능 영역 | 쓰는 문서 |
|---|---|
| 화면·문법·컴포넌트 | study1, study2 |
| 상태·검색 필터 | study3 |
| 라우팅·가드 | study4, study7 |
| 폼·검증 | study5 |
| API·CRUD | study6 |
| 인증·토큰 | study7 |
| 구조·환경변수 | study8 |
| 테스트 | study9 |
| 빌드·배포 | study10 |

---

## 2. 기능 목록

### 필수 (Must)

| # | 기능 | 화면/라우트 | 인증 | API (스펙 v1) |
|---|---|---|---|---|
| F1 | 게시글 목록 + 제목/본문 검색 + 페이지 이동 | `/` | — | `GET /api/posts?q&page&limit` |
| F2 | 게시글 상세 + 댓글 목록 | `/posts/:id` | — | `GET /api/posts/{id}`, `GET /api/posts/{id}/comments` |
| F3 | 회원가입 (검증 + 서버 오류 표시) | `/signup` | — | `POST /api/auth/signup` |
| F4 | 로그인 / 로그아웃 / 새로고침 후 유지 | `/login` | — | `POST /api/auth/login`, `GET /api/auth/me` |
| F5 | 글 작성 | `/posts/new` | 필요 | `POST /api/posts` |
| F6 | 글 수정 (작성자만) | `/posts/:id/edit` | 작성자 | `PATCH /api/posts/{id}` |
| F7 | 글 삭제 (작성자만) | 상세 화면 버튼 | 작성자 | `DELETE /api/posts/{id}` |
| F8 | 401 → 로그인 화면, 403 → 안내 메시지 | 공통 | — | — |
| F9 | 404 화면, 서버 오류/연결 실패 화면 | 공통 | — | — |

### 선택 (Could)

- 댓글 작성/삭제 (`POST /api/posts/{id}/comments`, `DELETE /api/comments/{id}`)
- 즐겨찾기 (프론트 `localStorage`만 사용)
- 검색어를 URL 쿼리(`?q=`)에 유지

### 이번 범위에서 제외

- 이미지 업로드, 소셜 로그인, 무한 스크롤, 실시간 갱신 (필요 시 심화 구간)

---

## 3. 폴더 구조

```
project/
├─ .env.example
├─ .env.development
├─ .env.production
├─ vite.config.js            # '@' 별칭, /api 프록시, vitest 설정
├─ src/
│  ├─ main.js                # Pinia·Router 등록, auth.restore() 후 mount
│  ├─ App.vue
│  ├─ config/env.js
│  ├─ api/
│  │  ├─ client.js           # request(), ApiError
│  │  ├─ auth.js             # signup, login, me
│  │  ├─ posts.js            # listPosts, getPost, createPost, updatePost, deletePost
│  │  └─ comments.js
│  ├─ stores/
│  │  ├─ auth.js             # user, token, login/restore/logout/authed
│  │  └─ favorites.js        # (선택) localStorage 연동
│  ├─ composables/
│  │  ├─ useAsync.js
│  │  └─ useDebounce.js
│  ├─ router/index.js        # routes + beforeEach(requiresAuth)
│  ├─ components/
│  │  ├─ AppHeader.vue
│  │  ├─ PostCard.vue
│  │  ├─ Pagination.vue
│  │  ├─ FormField.vue       # label + input + 오류 문구
│  │  └─ StateMessage.vue    # loading / error / empty 표시
│  ├─ utils/format.js
│  └─ views/
│     ├─ PostListView.vue
│     ├─ PostDetailView.vue
│     ├─ PostFormView.vue    # 작성·수정 겸용
│     ├─ LoginView.vue
│     ├─ SignupView.vue
│     └─ NotFoundView.vue
└─ src/**/__tests__/*.spec.js
```

---

## 4. 구현 순서

각 단계는 "작동 확인 → 다음 단계" 순서로 진행하고, **커밋도 단계 단위**로 나눕니다 (`feat: ...`, [COMMIT_GUIDE](./.agent/COMMIT_GUIDE.md) 참고).

| 단계 | 할 일 | 참고 | 완료 확인 |
|---|---|---|---|
| 1 | `.env*`, `config/env.js`, `vite.config.js` 프록시 설정 | study8, study6 | 브라우저의 `/api/posts` 요청이 프록시를 거쳐 200으로 응답 |
| 2 | `api/client.js` + `api/posts.js` | study6 | 콘솔에서 `listPosts()` 결과 확인 |
| 3 | 목록 화면을 API로 교체 (검색, 페이지, loading/error/empty) | study3, 6 | 서버 끄면 오류 + 다시 시도 |
| 4 | 상세 화면을 API로 교체 (`Promise.all`, 404 처리) | study4 | 없는 id → 안내 화면 |
| 5 | `stores/auth.js` 실제 로그인 + `localStorage` + `restore()` | study7 | 새로고침 후에도 로그인 유지 |
| 6 | 로그인·회원가입 폼 (검증 + 서버 `fields`) | study5 | 중복 이메일 시 필드 아래 오류 |
| 7 | 라우트 가드 + `redirect` 복귀 | study7 | 로그아웃 상태로 `/posts/new` 접근 시 `/login` |
| 8 | 작성·수정 화면 (`PostFormView`) | study5, 6 | 저장 후 상세로 이동, 새로고침해도 남음 |
| 9 | 삭제 + 작성자 전용 버튼 + 401/403 공통 처리 | study7 | 남의 글 삭제 → 403 안내 |
| 10 | composable·공통 컴포넌트 정리 (`useAsync`, `StateMessage`) | study8 | 중복 코드 감소 |
| 11 | Vitest: auth 스토어, `client.js`, `PostCard`, 폼 검증 | study9 | `npm run test:run` 통과 |
| 12 | `build` → `preview` → 정적 배포 + SPA fallback | study10 | 배포 URL에서 `/posts/1` 새로고침 OK |

### 핵심 코드 발췌 — 단계 3: 목록 화면

```vue
<script setup>
import { ref, watch, onMounted } from 'vue'
import { listPosts } from '@/api/posts.js'
import { useAsync } from '@/composables/useAsync.js'
import { useDebouncedRef } from '@/composables/useDebounce.js'

const keyword = ref('')
const debounced = useDebouncedRef(keyword, 300)
const page = ref(1)

const { data: result, loading, error, run: load } =
  useAsync(() => listPosts({ q: debounced.value, page: page.value }))

onMounted(load)
watch(debounced, () => { page.value = 1; load() })   // 검색어가 바뀌면 1페이지부터
watch(page, load)
</script>

<template>
  <input v-model="keyword" placeholder="검색" />
  <StateMessage :loading="loading" :error="error" :empty="result?.data.length === 0" @retry="load">
    <PostCard v-for="p in result?.data" :key="p.id" :post="p" />
  </StateMessage>
  <Pagination v-if="result" v-model:page="page" :total-pages="result.meta.totalPages" />
</template>
```

| 줄 | 설명 |
|---|---|
| `useDebouncedRef(keyword, 300)` | 타이핑이 멈춘 뒤에만 API 호출 (study8) |
| `useAsync(() => listPosts(...))` | loading/error/data 3종 자동 관리 |
| `watch(debounced, ...)` | 검색어가 바뀌면 **1페이지로 되돌리고** 재조회 (페이지가 남아 있으면 빈 결과가 나옴) |
| `v-model:page` | 자식(`Pagination`)과 `page`를 양방향 연결 (`defineModel('page')`) |

---

## 5. 완성 체크리스트

### 기능

- ☐ F1 목록·검색·페이지
- ☐ F2 상세·댓글
- ☐ F3 회원가입 (클라이언트 + 서버 오류 표시)
- ☐ F4 로그인/로그아웃/새로고침 유지
- ☐ F5 글 작성
- ☐ F6 글 수정 (작성자만)
- ☐ F7 글 삭제 (작성자만)
- ☐ F8 401 → 로그인 화면(redirect 복귀), 403 → 안내
- ☐ F9 404·연결 실패 화면

### 품질

- ☐ 모든 API 호출이 `api/` 모듈을 통한다 (화면에 `fetch` 주소 없음)
- ☐ `import.meta.env`는 `config/env.js`에서만 읽는다
- ☐ `.env.local`·토큰·비밀 값이 git에 없다
- ☐ `v-for` 모두 고유 `:key`
- ☐ 요청 중 버튼 비활성화(중복 제출 방지)
- ☐ Console에 `[Vue warn]`·빨간 오류 없음

### 테스트·배포

- ☐ `npm run test:run` 통과 (스토어 2 + 컴포넌트 1 + 검증 함수 1 이상)
- ☐ `npm run build` 성공, `npm run preview`에서 전체 시나리오 통과
- ☐ 정적 호스팅 배포, 새로고침(SPA fallback)·CORS 확인

### 시나리오 점검 (수동)

1. 비로그인으로 목록·상세 열람 가능
2. 비로그인으로 `/posts/new` 접근 → 로그인 → 작성 화면으로 복귀
3. 글 작성 → 상세로 이동 → 새로고침해도 유지
4. 다른 계정으로 로그인해 남의 글 수정·삭제 시도 → 버튼 없음, API 직접 호출 시 403 안내
5. 토큰을 지우고 새로고침 → 로그아웃 상태
6. 서버를 끄고 목록 → 오류 화면 + 다시 시도 → 서버 켜고 복구

---

## 6. 회고 (작성 순서)

완성 후 아래 순서로 직접 채웁니다.

### 6.1 결과 요약

- 완성일: ____
- 완성한 기능 / 미완 기능: ____
- 사용한 study 문서: ____

### 6.2 잘 된 점 (Keep)

- 

### 6.3 막혔던 점과 해결 (Problem → Cause → Fix)

| 문제 | 원인 | 해결 | 배운 점 |
|---|---|---|---|
|  |  |  |  |

### 6.4 이번 범위의 한계 (Limit)

미리 적어 두는 후보 — 직접 겪었는지 표시하세요.

- ☐ 목록·상세를 화면 이동할 때마다 **다시 요청**한다 (캐시 없음) → [study11](./study11.md)
- ☐ 요청이 겹칠 때 **이전 응답이 나중 응답을 덮어쓸 수 있다** (경쟁 상태) → study11
- ☐ 번들 크기·로딩 속도를 **측정하지 않았다** → [study12](./study12.md)
- ☐ 타입이 없어 `post.author.nickname` 같은 오타를 실행해야 안다 → [study14](./study14.md)
- ☐ E2E 테스트·CI가 없다 → [study15](./study15.md)
- ☐ 토큰이 `localStorage`에 있다 (XSS 위험), 오류 로그가 수집되지 않는다 → [study16](./study16.md)
- ☐ 배포가 수동이다 → [study17](./study17.md)

### 6.5 다음에 할 일 (Next)

- 우선순위 1~3: ____

## ➡️ 다음 단계 연결

midpoint에서 느낀 한계가 곧 심화 구간의 주제입니다. [study11](./study11.md)에서 **상태·캐시·비동기 처리**를 한 단계 깊게 다룹니다.
