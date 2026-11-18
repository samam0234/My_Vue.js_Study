# study11 — 상태·데이터 흐름 심화

> 🎯 **목표**: Pinia를 구조적으로 쓰고, 요청 캐시·중복 제거·취소·경쟁 상태 방지 같은 **비동기 데이터 흐름**을 직접 구현한다.

- 이전: [studyMidpoint](./studyMidpoint.md) (한계: 캐시 없음, 경쟁 상태)
- 구현 위치: [`project/final/src/api/cache.ts`](./project/final/src/api/cache.ts), [`composables/useLatestRequest.ts`](./project/final/src/composables/useLatestRequest.ts), [`components/CommentSection.vue`](./project/final/src/components/CommentSection.vue)(낙관적 업데이트), [`views/PostListView.vue`](./project/final/src/views/PostListView.vue)
- 구현 메모: 캐시는 `signal` 을 함께 받아 **취소된 진행 중 요청을 다른 호출이 재사용하지 않게** 했습니다(같은 키로 이전 요청을 취소하고 곧바로 다시 부르면 취소된 Promise 를 받는 경합이 생김). 취소 판별은 `instanceof DOMException` 이 아니라 `err.name` 으로 합니다.

---

## 📖 이론

### 11.1 상태의 종류를 구분한다

| 종류 | 예 | 어디에 두나 |
|---|---|---|
| **로컬 UI 상태** | 모달 열림, 입력 중인 값 | 컴포넌트의 `ref` |
| **공유 클라이언트 상태** | 로그인 사용자, 테마 | Pinia |
| **서버 상태** | 게시글 목록, 댓글 (원본은 서버) | 캐시 계층 (직접 구현 또는 Query 라이브러리) |
| **URL 상태** | 검색어, 페이지 번호 | 라우트 `query` |

서버 상태를 Pinia에 "복사해서 영구 보관"하면 **오래된 데이터(stale)** 문제가 생깁니다. 서버 상태는 *빌려 쓰는 캐시*로 보고 만료·재검증 규칙을 둡니다.

### 11.2 Pinia 심화 개념

| 개념 | 설명 |
|---|---|
| `storeToRefs(store)` | 스토어의 state/getter를 **반응성을 유지한 채** 구조분해 (액션은 `store.xxx`로) |
| `$patch` | 여러 상태를 한 번에 변경 |
| `$reset()` | Options Store 전용. Setup Store는 직접 초기화 함수를 만든다 |
| `$subscribe` | 상태 변화를 구독 (영속화·로그에 사용) |
| 스토어 간 사용 | 스토어 안에서 다른 `useXxxStore()` 호출 가능 (순환 의존은 피한다) |

### 11.3 캐시 전략 — stale-while-revalidate

```
요청 → 캐시 있음 & 신선(TTL 이내)?  → 바로 반환 (네트워크 없음)
       캐시 있음 & 오래됨?          → 일단 캐시 보여주고, 뒤에서 재요청해 갱신
       캐시 없음?                   → 로딩 표시 후 요청
```

### 11.4 비동기 함정

| 문제 | 설명 | 해결 |
|---|---|---|
| **경쟁 상태(race)** | 검색 "a" 요청이 "ab"보다 늦게 도착해 최신 결과를 덮어씀 | 이전 요청 취소(`AbortController`) 또는 요청 번호 비교 |
| **중복 요청** | 같은 데이터를 동시에 두 번 요청 | 진행 중인 Promise를 공유 (in-flight dedupe) |
| **낙관적 업데이트** | 서버 응답 전에 화면부터 바꿈 | 실패 시 롤백 |
| **직렬 대기** | 서로 무관한 요청을 `await`로 순서대로 | `Promise.all` / `allSettled` |

---

## 🛠️ 실기

### 실습 1. `storeToRefs`로 안전하게 구조분해

```js
import { storeToRefs } from 'pinia'
const auth = useAuthStore()

const { user, isLoggedIn } = storeToRefs(auth)   // ✅ 반응성 유지
const { login, logout } = auth                   // 액션은 그냥 꺼낸다

const { user: bad } = auth                       // ❌ 값 복사 — 갱신 안 됨
```

### 실습 2. 요청 취소로 경쟁 상태 막기

```js
// src/composables/useLatest.js
export function useLatestRequest() {
  let controller = null

  return async function run(fn) {
    controller?.abort()                      // 이전 요청 취소
    controller = new AbortController()
    try {
      return await fn(controller.signal)
    } catch (err) {
      if (err.name === 'AbortError') return undefined   // 취소는 오류가 아님
      throw err
    }
  }
}
```

`request()`가 `signal`을 `fetch`에 전달하도록 옵션을 추가합니다.

```js
// api/client.js — request 옵션에 signal 추가
export async function request(path, { method = 'GET', body, token, signal } = {}) {
  res = await fetch(`${BASE_URL}${path}`, { method, headers, body: ..., signal })
  // ...
}
```

사용:

```js
const latest = useLatestRequest()

async function load() {
  loading.value = true
  try {
    const res = await latest((signal) => listPosts({ q: keyword.value, signal }))
    if (res) result.value = res      // 취소된 요청(undefined)은 무시
  } finally {
    loading.value = false
  }
}
```

| 줄 | 설명 |
|---|---|
| `controller?.abort()` | 새 요청 시작 직전, 아직 안 끝난 이전 요청을 중단 |
| `err.name === 'AbortError'` | 우리가 일부러 취소한 것이므로 오류 UI를 띄우지 않는다 |
| `if (res)` | 취소된 호출은 `undefined`를 반환 → 화면 갱신 생략 |

### 실습 3. 간단한 쿼리 캐시 (TTL + 중복 요청 공유)

```js
// src/api/cache.js
const store = new Map()      // key → { data, at }
const inflight = new Map()   // key → Promise

export async function cached(key, fetcher, { ttl = 30_000 } = {}) {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.data       // 신선: 즉시 반환

  if (inflight.has(key)) return inflight.get(key)             // 같은 요청 진행 중: 공유

  const p = fetcher()
    .then((data) => {
      store.set(key, { data, at: Date.now() })
      return data
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, p)
  return p
}

export const invalidate = (prefix) => {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k)
}
```

사용:

```js
export const getPost = (id) =>
  cached(`post:${id}`, () => request(`/api/posts/${id}`).then((r) => r.data), { ttl: 60_000 })

export async function updatePost(id, body, token) {
  const data = await request(`/api/posts/${id}`, { method: 'PATCH', body, token }).then((r) => r.data)
  invalidate('post:')     // 수정했으니 관련 캐시 폐기
  invalidate('posts:')
  return data
}
```

| 줄 | 설명 |
|---|---|
| `Date.now() - hit.at < ttl` | 만료 시간 안이면 서버에 안 간다 |
| `inflight` | 같은 키를 동시에 두 번 요청해도 네트워크는 **한 번만** |
| `.finally(() => inflight.delete(key))` | 성공·실패 모두에서 진행 중 표시 제거 |
| `invalidate(prefix)` | **변경 후 캐시 무효화**. 캐시에서 가장 중요한 규칙 |

### 실습 4. 낙관적 업데이트 — 즐겨찾기/좋아요 패턴

```js
async function toggleLike(post) {
  const before = post.liked
  post.liked = !before                       // ① 화면 먼저 바꾼다
  try {
    await request(`/api/posts/${post.id}/like`, { method: 'POST', token })
  } catch (err) {
    post.liked = before                      // ② 실패하면 롤백
    alert('처리에 실패했습니다.')
  }
}
```

> `/like` 엔드포인트는 공통 API 스펙 v1에 없으므로, 백엔드에 추가한 경우에만 사용하세요. 패턴 이해용 예시입니다.

### 실습 5. 병렬 vs 직렬, `allSettled`

```js
// 서로 무관한 두 요청은 동시에
const [postRes, commentsRes] = await Promise.all([getPost(id), listComments(id)])

// 일부가 실패해도 나머지는 쓰고 싶다면
const results = await Promise.allSettled([getPost(id), listComments(id)])
const post = results[0].status === 'fulfilled' ? results[0].value : null
const comments = results[1].status === 'fulfilled' ? results[1].value : []
```

### 실습 6. (선택) 서버 상태 라이브러리 맛보기 — TanStack Query

직접 만든 캐시가 하는 일(TTL, 중복 제거, 재검증, 무효화)을 라이브러리가 제공합니다.

```bash
npm install @tanstack/vue-query
```

```js
// main.js
import { VueQueryPlugin } from '@tanstack/vue-query'
app.use(VueQueryPlugin)
```

```js
const { data, isPending, error } = useQuery({
  queryKey: ['posts', keyword, page],        // ref를 키에 넣으면 값이 바뀔 때 자동 재조회
  queryFn: () => listPosts({ q: keyword.value, page: page.value }),
  staleTime: 30_000,
})
```

직접 구현으로 개념을 이해한 뒤에 도입하면 "왜 필요한지"가 분명해집니다. 도입 여부는 프로젝트 규모로 결정합니다.

### 실행 확인

1. 검색창에 빠르게 `a`→`ab`→`abc` 입력, Network 탭에 앞선 요청이 **(canceled)** 로 표시되는지
2. 목록 → 상세 → 뒤로가기를 반복할 때 두 번째부터 네트워크 요청이 안 나가는지(캐시 적중)
3. 글을 수정한 뒤 상세를 다시 열면 **새 내용**이 보이는지(무효화 확인)
4. 캐시 TTL을 5초로 줄여 만료 후 다시 요청이 나가는지

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 글을 수정했는데 이전 내용이 계속 보임 | 캐시 무효화 누락 | 변경 API 성공 후 `invalidate` |
| 검색 결과가 입력과 다르게 뒤늦게 바뀜 | 경쟁 상태 | 취소 또는 최신 요청 번호만 반영 |
| 취소했는데 화면에 오류가 뜸 | `AbortError`를 일반 오류로 처리 | `err.name === 'AbortError'` 무시 |
| `storeToRefs`로 꺼낸 값이 갱신 안 됨 | 액션까지 `storeToRefs`에 넣음 / 아예 안 씀 | state·getter만 `storeToRefs`, 액션은 스토어에서 |
| 캐시 객체를 화면에서 수정했더니 다른 화면도 바뀜 | 같은 객체 참조 공유 | 반환 시 복사(`structuredClone`) 또는 읽기 전용으로 사용 |
| 로그아웃 후에도 이전 사용자 데이터가 보임 | 캐시·스토어 미초기화 | 로그아웃 시 캐시 전체 비우기 |
| 낙관적 업데이트 후 서버 실패인데 화면은 성공 상태 | 롤백 누락 | `catch`에서 원래 값 복구 |
| 메모리가 계속 늘어남 | 캐시 크기 제한 없음 | 최대 항목 수(LRU) 또는 TTL 정리 |

---

## ☐ 체크리스트

- ☐ 로컬 UI / 공유 / 서버 / URL 상태를 구분해 각각 둘 곳을 정했다
- ☐ `storeToRefs`로 스토어를 반응성 유지하며 구조분해
- ☑ `AbortController`로 이전 요청을 취소해 경쟁 상태를 막았다 (Network에서 `canceled` 확인) — `PostListView` + `useLatestRequest`
- ☑ TTL 캐시 + in-flight 공유를 구현하고 적중/만료를 확인 — `api/cache.ts` (`cache.spec.ts` 로 적중·만료·in-flight 공유·취소 검증)
- ☑ 변경 API 후 캐시 무효화 — `createPost`/`updatePost`/`deletePost`/댓글 API
- ☑ 낙관적 업데이트와 롤백을 구현(또는 설명) — `CommentSection` 작성·삭제 (실패 시 롤백, 통합 테스트로 검증)
- ☐ `Promise.all` vs `allSettled`의 차이를 설명
- ☐ (선택) TanStack Query로 같은 목록을 구현해 직접 구현과 비교

## ➡️ 다음 단계 연결

데이터 흐름이 정돈되었으니 **느린 부분을 숫자로 찾는** 단계로 갑니다. [study12](./study12.md)에서 측정 → 최적화 → 재측정을 합니다.
