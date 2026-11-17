# study3 — 데이터 다루기

> 🎯 **목표**: `ref` / `reactive` / `computed` / `watch` / 라이프사이클 훅으로 상태를 만들고, 언제 무엇을 쓸지 판단한다.

- 이전: [study2](./study2.md) 컴포넌트
- 대응 코드: [`demo/src/components/`](./demo/src/components) 의 `RefReactivePractice.vue`, `ComputedPractice.vue`, `WatchPractice.vue`, `LifecyclePractice.vue`

---

## 📖 이론

### 3.1 `ref` — 단일 값(원시값 포함)을 반응형으로

```js
import { ref } from 'vue'

const count = ref(0)
const user = ref({ name: '홍길동', age: 20 })

count.value++            // 스크립트에서는 .value 필수
user.value.age = 21
```

- 원시값(number, string)은 추적 방법이 없으므로 Vue가 `{ value: 0 }`로 감싼다 → `.value`.
- **템플릿에서는 `.value`를 쓰지 않는다** (자동 언랩): `{{ count }}`.

### 3.2 `reactive` — 객체 전체를 반응형으로

```js
import { reactive } from 'vue'
const form = reactive({ email: '', password: '' })
form.email = 'a@b.com'   // .value 없이 접근
```

단점: 통째로 교체(`form = {...}`)하면 반응성을 잃고, 구조분해하면 연결이 끊긴다.

```js
const { email } = form          // ❌ 반응성 끊김 (단순 문자열 복사)
const { email } = toRefs(form)  // ✅ ref로 변환해서 연결 유지
```

### 3.3 `ref` vs `reactive` 선택 기준

| 상황 | 추천 |
|---|---|
| 숫자, 문자열, 불리언, 배열, "통째로 교체될 수 있는" 값 | `ref` |
| 폼처럼 항상 같은 모양을 유지하는 객체 | `reactive` |
| 확신이 없으면 | **`ref` 하나로 통일** (가장 예외가 적다) |

### 3.4 `computed` — 파생 값 (캐시됨)

다른 반응형 값으로부터 **계산되는 값**. 의존하는 값이 바뀔 때만 다시 계산하고, 그렇지 않으면 캐시를 돌려줍니다. 함수로 매번 계산하는 것과 달리 "렌더링마다 재실행"되지 않습니다.

### 3.5 `watch` — 값이 바뀔 때 **부수 작용** 실행

| | `computed` | `watch` |
|---|---|---|
| 목적 | 값을 **만든다** | 일을 **실행한다** (fetch, 로그, 저장) |
| 반환 | 값 | 없음 |
| 예 | 필터된 목록, 합계 | 검색어 변경 시 API 호출, localStorage 저장 |

옵션: `immediate: true`(처음에도 실행), `deep: true`(중첩 속성까지 감시). `watchEffect`는 안에서 쓴 값을 자동으로 추적합니다.

### 3.6 라이프사이클 훅

| 훅 | 시점 | 주 용도 |
|---|---|---|
| `onMounted` | DOM에 붙은 직후 | 첫 데이터 fetch, 라이브러리 초기화 |
| `onUpdated` | 데이터 변경으로 DOM 갱신 후 | (드물게) DOM 측정 |
| `onUnmounted` | 제거 직전·직후 | 타이머·이벤트 리스너·구독 해제 |

---

## 🛠️ 실기

### 실습 1. `computed` — 검색 + 필터 목록 (`project/PostListView.vue`)

```js
const posts = ref([])
const keyword = ref('')
const showOnlyFavorites = ref(false)

const filteredPosts = computed(() => {
  return posts.value
    .filter((post) => post.title.includes(keyword.value.trim()))
    .filter((post) => !showOnlyFavorites.value || favoritesStore.isFavorite(post.id))
})
```

| 줄 | 설명 |
|---|---|
| `computed(() => { ... })` | 안에서 읽은 `posts`, `keyword`, `showOnlyFavorites`, 즐겨찾기 상태를 **자동 추적** |
| `.filter(... includes(...))` | 검색어 포함 여부로 1차 필터 |
| `!showOnlyFavorites.value \|\| ...` | 체크가 꺼져 있으면 통과, 켜져 있으면 즐겨찾기만 통과 |

사용: 템플릿에서 `v-for="post in filteredPosts"`. 원본 `posts`는 그대로 두고 **파생만** 바뀝니다.

### 실습 2. `watch` — 검색어 변경 로그

```js
watch(keyword, (newVal, oldVal) => {
  if (newVal) {
    console.log(`"${newVal}" 검색 결과: ${filteredPosts.value.length}건`)
  }
})
```

| 줄 | 설명 |
|---|---|
| `watch(keyword, ...)` | `keyword` ref를 감시. 콜백은 `(새 값, 이전 값)` |
| `if (newVal)` | 입력을 모두 지웠을 때는 로그 생략 |

### 실습 3. 즐겨찾기를 새로고침 후에도 유지 — `watch` + `localStorage`

`project/src/stores/favorites.js`는 현재 `Set`을 메모리에만 두기 때문에 새로고침하면 사라집니다. `watch` + `localStorage`로 해결하는 방법입니다.

```js
// 예시(저장소 코드에는 아직 반영하지 않음)
import { ref, watch } from 'vue'

const KEY = 'mini-board:favorites'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []        // 저장값이 깨졌을 때도 앱이 죽지 않게
  }
}

const favoriteIds = ref(load())               // 시작할 때 복원

watch(
  favoriteIds,
  (ids) => localStorage.setItem(KEY, JSON.stringify(ids)),
  { deep: true },                             // 배열 내부 push/splice 감지
)
```

| 줄 | 설명 |
|---|---|
| `JSON.parse(localStorage.getItem(KEY)) ?? []` | 값이 없으면(`null`) 빈 배열 |
| `try/catch` | 사용자가 값을 손으로 망가뜨려도 앱이 시작되도록 방어 |
| `{ deep: true }` | `favoriteIds.value.push(1)`처럼 **내부 변경**도 감지 |
| `Set`이 아닌 배열을 쓰는 이유 | `JSON.stringify(new Set())`은 `{}`가 되어 저장이 안 된다 |

> 같은 개념의 로그인 유지는 [study7](./study7.md)에서 다룹니다.

### 실습 4. `onMounted` — 첫 데이터 불러오기

```js
onMounted(() => {
  fetchPosts()
})
```

화면이 DOM에 붙은 직후 `fetchPosts()`를 호출하는 것이 가장 흔한 패턴입니다 (자세한 fetch는 [study6](./study6.md)).

### 실습 5. 구조분해와 `toRefs`

```js
const form = reactive({ email: '', password: '' })

const { email, password } = toRefs(form)   // 각각 ref, form과 연결 유지
email.value = 'a@b.com'                    // form.email도 바뀜
```

### 실행 확인

```bash
cd demo && npm run dev
```

1. `RefReactivePractice` — 값을 바꿨을 때 화면이 갱신되는지, 구조분해 버전은 갱신되지 않는지 비교
2. `ComputedPractice` — 같은 입력으로 `computed`는 콘솔 로그가 한 번만, 일반 함수는 렌더링마다 찍히는지 비교
3. `WatchPractice` — 값을 바꿀 때 콘솔에 로그가 찍히는지
4. Vue DevTools → Components 탭에서 `ref`/`computed` 값이 실시간으로 바뀌는지 확인

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 스크립트에서 `count++` 했는데 화면이 안 바뀜 | `ref`는 `.value`로 접근해야 함 | `count.value++` |
| 템플릿에서 `{{ count.value }}`가 비어 보임 | 템플릿은 자동 언랩 | `{{ count }}` |
| `reactive` 객체를 구조분해했더니 갱신 안 됨 | 구조분해는 값 복사 | `toRefs()` 또는 `ref` 사용 |
| `reactive`에 새 객체를 대입했더니 화면이 멈춤 | 변수 자체를 교체하면 연결이 끊김 | `ref`로 바꾸거나 `Object.assign(obj, newObj)` |
| `watch`가 배열 내부 변경에 반응 안 함 | 얕은 감시 | `{ deep: true }` 또는 `watch(() => [...arr.value], ...)` |
| `computed` 안에서 값을 바꾸고 있음 | `computed`는 **순수**해야 함 (부수 작용 금지) | 부수 작용은 `watch`로 |
| `localStorage.getItem` 결과가 `"undefined"` 문자열 | `JSON.stringify(undefined)` 저장 | 저장 전 값 검증, 읽을 때 `try/catch` |
| `onUnmounted`를 안 써서 타이머가 계속 동작 | 정리 누락 | `setInterval` → `onUnmounted(() => clearInterval(id))` |

---

## ☐ 체크리스트

- ☑ `ref`/`reactive`의 차이와 `.value` 규칙을 설명할 수 있다
- ☑ 구조분해로 반응성이 끊기는 이유와 `toRefs` 해법을 안다
- ☑ `computed`로 검색+필터 파생 목록을 만들었다 (`filteredPosts`)
- ☑ `watch`로 검색어 변경을 감시했다
- ☑ `onMounted`로 첫 fetch를 실행했다
- ☑ 즐겨찾기를 `watch` + `localStorage`로 새로고침 후에도 유지 (실습 3) — `demo` PropsEmitPractice(watch+localStorage), `project` favorites 스토어(VueUse `useLocalStorage`)
- ☐ `watchEffect`로 같은 기능을 구현해 보고 `watch`와의 차이를 한 줄로 정리

## ➡️ 다음 단계 연결

상태가 준비되었으니 URL에 따라 **어떤 화면을 보여줄지** [study4](./study4.md) 라우팅에서 다룹니다. 상세 화면은 URL의 `id`를 상태로 받아 사용합니다.
