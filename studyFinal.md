# studyFinal — 종합 실습: 미니 게시판 웹사이트

study0부터 study7까지 하나씩 익혔던 개념들을 전부 합쳐서, `demo/`가 아닌 **새 프로젝트** [`project/`](./project)에 작지만 실제로 동작하는 웹사이트를 만들었습니다.

```
- [x] Vue 3 + Vite 프로젝트 생성                  (study1)
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if  (study1)
- [x] ref, reactive, computed, watch             (study2)
- [x] 컴포넌트 props / emit                       (study3)
- [x] Vue Router (목록 → 상세)                    (study4)
- [x] 폼 검증                                     (study5)
- [x] fetch로 API 호출                            (study6)
- [x] Pinia로 로그인 상태 공유                    (study7)
- [x] 위 전부를 하나로 합친 실전 웹사이트         (studyFinal — 이번 문서)
```

---

## 1. 왜 `demo/`가 아니라 `project/`를 새로 만들었나

`demo/`는 각 개념을 **하나씩 떼어놓고** 실습하기 위해 한 페이지에 실습 컴포넌트를 계속 쌓아온 "연습장"이었습니다. 반면 `studyFinal`의 목적은 "이 개념들을 실제 서비스에서 어떻게 **조합**해서 쓰는지" 감을 잡는 것이므로, 처음부터 하나의 완결된 웹사이트 구조로 새로 설계했습니다.

## 2. 사이트 소개: 미니 게시판 (Mini Board)

JSONPlaceholder(study6에서 쓴 그 API)의 게시글/댓글/사용자 데이터를 이용한 간단한 게시판입니다.

| 기능 | 대응하는 study |
|---|---|
| 게시글 목록 (검색, 즐겨찾기 필터) | study1(템플릿), study2(computed/watch) |
| 게시글 카드 컴포넌트 분리 | study3(props/emit) |
| 목록 → 상세 페이지 라우팅 | study4(Vue Router) |
| 로그인 폼 검증 | study5(폼 검증) |
| 게시글/댓글/사용자 목록 fetch | study6(fetch) |
| 로그인 상태 + 즐겨찾기 상태 공유 | study7(Pinia) |

## 3. 프로젝트 구조

```
project/
├─ src/
│  ├─ main.js
│  ├─ App.vue                      # AppHeader + <RouterView>
│  ├─ router/
│  │  └─ index.js                  # '/', '/posts/:id', '/login'
│  ├─ stores/
│  │  ├─ auth.js                   # 로그인 상태 (study7)
│  │  └─ favorites.js              # 즐겨찾기한 게시글 id 관리
│  ├─ components/
│  │  ├─ AppHeader.vue             # 네비게이션 + 로그인 상태 표시
│  │  └─ PostCard.vue              # 게시글 카드 (props/emit)
│  └─ views/
│     ├─ PostListView.vue          # '/' 게시글 목록
│     ├─ PostDetailView.vue        # '/posts/:id' 게시글 상세 + 댓글
│     └─ LoginView.vue             # '/login' 로그인 폼
```

`npm create vue@latest project -- --router --pinia`로 생성한 뒤, `demo/`의 기본 예시 컴포넌트(HelloWorld, TheWelcome 등)는 전부 지우고 실제 화면들로 채웠습니다.

## 4. 핵심 흐름 하나씩 짚어보기

### 4.1 게시글 목록 — 검색 + 즐겨찾기 필터 (`PostListView.vue`)

```js
const posts = ref([])
const keyword = ref('')
const showOnlyFavorites = ref(false)

async function fetchPosts() {
  loading.value = true
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=12')
    if (!res.ok) throw new Error(`게시글을 불러오지 못했습니다 (HTTP ${res.status})`)
    posts.value = await res.json()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(fetchPosts)

const filteredPosts = computed(() => {
  return posts.value
    .filter((post) => post.title.includes(keyword.value.trim()))
    .filter((post) => !showOnlyFavorites.value || favoritesStore.isFavorite(post.id))
})
```

- `fetch` + `onMounted` (study6): 화면이 뜨자마자 게시글을 불러옴
- `computed`(study2)로 "검색어 + 즐겨찾기" 두 조건을 동시에 반영한 목록을 파생 — `posts`나 `keyword`나 즐겨찾기 상태가 바뀌면 자동으로 재계산됨
- `watch`(study2)로 검색어가 바뀔 때마다 검색 결과 건수를 콘솔에 로그

### 4.2 게시글 카드 — props/emit (`PostCard.vue`)

```vue
<script setup>
defineProps({ post: Object, isFavorite: Boolean })
const emit = defineEmits(['toggle-favorite'])

function handleFavoriteClick(event) {
  event.preventDefault()   // RouterLink의 페이지 이동을 막음
  event.stopPropagation()
  emit('toggle-favorite')
}
</script>

<template>
  <RouterLink :to="`/posts/${post.id}`" class="card">
    <button @click="handleFavoriteClick">{{ isFavorite ? '★' : '☆' }}</button>
    <h3>{{ post.title }}</h3>
  </RouterLink>
</template>
```

- 카드 전체가 `<RouterLink>`(study4)라서 클릭하면 상세 페이지로 이동
- 그 안의 즐겨찾기 버튼은 `event.preventDefault()`로 페이지 이동을 막고, `emit`(study3)으로 부모에게만 알림 — 부모(`PostListView`)가 실제 로그인 체크와 상태 변경을 담당

```js
function handleToggleFavorite(postId) {
  if (!authStore.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favoritesStore.toggle(postId)
}
```

여기서 `authStore`(로그인 여부)와 `favoritesStore`(즐겨찾기 목록)가 **모두 Pinia 스토어**라서, "로그인 안 한 사용자는 즐겨찾기를 못 누른다"는 규칙을 목록 페이지, 상세 페이지 어디서든 똑같이 적용할 수 있습니다.

### 4.3 게시글 상세 — 라우트 파라미터 + 병렬 fetch (`PostDetailView.vue`)

```js
const route = useRoute()

async function fetchPostDetail(id) {
  const [postRes, commentsRes] = await Promise.all([
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}`),
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}/comments`),
  ])
  post.value = await postRes.json()
  comments.value = await commentsRes.json()
}

onMounted(() => fetchPostDetail(route.params.id))

// 상세 페이지에서 다른 글로 바로 이동하는 경우까지 대비
watch(() => route.params.id, (newId) => fetchPostDetail(newId))
```

- `route.params.id`(study4)로 URL의 동적 파라미터를 읽음
- `Promise.all([...])`: study0/study6에서 다룬 `fetch`를 한 단계 더 확장 — 게시글 본문과 댓글을 **동시에** 요청해서 기다리는 시간을 줄임 (둘 다 끝날 때까지 기다렸다가 진행)
- `watch(() => route.params.id, ...)`: study2에서 배운 "특정 값만 콕 집어 감시하기" 패턴. `onMounted`는 처음 페이지에 들어올 때만 실행되므로, 상세 페이지에 있는 상태에서 다른 글 id로 URL만 바뀌는 경우까지 대응하려면 `route.params.id`를 별도로 감시해야 합니다.

### 4.4 로그인 폼 → 헤더로 상태 전파 (`LoginView.vue`, `AppHeader.vue`)

```js
// LoginView.vue
async function handleSubmit() {
  submitted.value = true
  if (!isValid.value) return

  const success = await authStore.login({ email: form.email, password: form.password })
  if (success) {
    router.push('/')   // study4: 코드로 페이지 이동
  }
}
```

```vue
<!-- AppHeader.vue -->
<script setup>
import { useAuthStore } from '../stores/auth.js'
const authStore = useAuthStore()
</script>

<template>
  <span v-if="authStore.isLoggedIn">👤 {{ authStore.user.name }}님</span>
  <span v-else>로그인하지 않음</span>
</template>
```

- 폼 검증(study5)을 통과한 뒤 `authStore.login(...)`을 호출 — 내부는 study6의 fetch 패턴
- 로그인에 성공하면 `router.push('/')`로 목록 페이지로 리다이렉트 (`LoginView`가 페이지 전체를 차지하는 라우트라서, study7 실습의 "같은 화면에 로그인 폼과 로그인됨 화면이 공존"하는 방식 대신 **페이지 자체를 이동**하는 방식을 택함 — 실제 서비스에서 더 흔한 패턴)
- `AppHeader`는 `LoginView`와 부모-자식 관계가 전혀 아니지만, 같은 `useAuthStore()`를 구독하므로 로그인 성공 즉시 상태가 반영됨 (study7)

## 5. 실행 방법

```bash
cd project
npm install
npm run dev
```

## 6. 직접 확인해볼 시나리오

1. **목록 페이지**: 검색창에 아무 단어나 입력 → 실시간으로 목록이 좁혀지는지, 개발자도구 콘솔에 검색 결과 건수 로그가 찍히는지
2. **로그인 없이 즐겨찾기 시도**: 별표 클릭 → "로그인 후 이용할 수 있습니다" 알림이 뜨는지
3. **로그인**: `/login`에서 "여기를 눌러 채우기"로 테스트 계정 자동 입력 → 로그인 → 자동으로 목록 페이지로 이동하고 헤더에 사용자 이름이 뜨는지
4. **로그인 후 즐겨찾기**: 여러 게시글에 별표 클릭 → "즐겨찾기만 보기" 체크 → 즐겨찾기한 것만 보이는지
5. **상세 페이지**: 카드 클릭 → 상세 페이지로 이동, 댓글 목록까지 보이는지, "← 목록으로"로 돌아가는지
6. **상세 페이지에서 즐겨찾기**: 상세 페이지에서도 즐겨찾기 토글이 목록 페이지와 상태를 공유하는지 (Pinia 확인 — 상세에서 즐겨찾기 해제하고 목록으로 돌아가면 반영되어 있어야 함)
7. **로그아웃**: 헤더에서 로그아웃 → 다시 "로그인하지 않음" 상태로 바뀌고, 즐겨찾기 버튼이 다시 막히는지

## 7. 아쉬운 점 / 더 발전시킨다면 (다음 학습 방향)

- **새로고침하면 로그인/즐겨찾기 상태가 날아감**: 지금은 Pinia 상태가 메모리에만 있어서 새로고침하면 초기화됩니다. `localStorage`와 연동하거나 `pinia-plugin-persistedstate` 같은 플러그인을 쓰면 해결할 수 있습니다.
- **실제 로그인 서버가 없음**: JSONPlaceholder는 진짜 인증을 하지 않으므로, 이메일만 일치하면 로그인됩니다. 실전에서는 비밀번호 해시 비교, JWT 토큰 발급/저장 같은 과정이 필요합니다.
- **테스트 코드가 없음**: 지금까지는 전부 브라우저에서 직접 눌러보며 확인했습니다. Vitest 같은 도구로 자동화된 테스트를 작성하는 것도 다음 단계로 좋은 주제입니다.
- **TypeScript 미적용**: 처음부터 개념에 집중하기 위해 순수 JS로 진행했습니다. 규모가 커지면 TypeScript 도입을 고려할 만합니다.

여기까지가 이 저장소의 학습 로드맵입니다. `study0.md`부터 `studyFinal.md`까지 순서대로 따라오면, Vue 3의 핵심 개념을 이론 → 개별 실습 → 종합 프로젝트 순으로 익힐 수 있도록 구성했습니다.
