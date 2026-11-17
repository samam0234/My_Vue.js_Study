# study8 — 구조화·재사용

> 🎯 **목표**: 폴더 구조를 역할별로 정리하고, 반복되는 로직을 composable로 뽑아내며, 설정값을 `.env` 환경변수로 분리한다.

- 이전: [study7](./study7.md) 인증
- 대응 코드: `project/src/` 전체 (아직 `api/`, `composables/`, `config/` 폴더는 없음 — 이 문서가 추가 방법을 안내)
- 이 문서의 코드는 **저장소에 아직 반영하지 않은 실습 예시**입니다.

---

## 📖 이론

### 8.1 폴더는 "역할"로 나눈다

| 폴더 | 들어가는 것 | 규칙 |
|---|---|---|
| `views/` | 라우트 1개 = 화면 1개 | 조립만 하고, 로직은 아래 계층으로 |
| `components/` | 재사용 UI 조각 | props/emit으로만 소통, 전역 상태 의존 최소화 |
| `stores/` | Pinia 전역 상태 | 여러 화면이 공유하는 상태만 |
| `api/` | 서버 통신 함수 | `fetch` 주소는 여기에만 |
| `composables/` | 재사용 로직 (`useXxx`) | 반응형 상태 + 로직을 함수로 |
| `utils/` | 반응형이 아닌 순수 함수 | 날짜 포맷, 숫자 포맷 |
| `config/` | 환경 변수 접근 | `import.meta.env`는 여기서만 읽기 |

의존 방향: `views → components / composables / stores → api → config`. 아래 계층이 위 계층을 import하지 않는다.

### 8.2 Composable

"컴포넌트 안에서 쓰던 `ref`/`computed`/`watch`/훅을 **함수로 묶어 재사용**"하는 패턴입니다. 이름은 `use`로 시작합니다. 컴포넌트마다 반복되는 `loading/error/data` 3종 세트가 대표적인 대상입니다.

### 8.3 환경변수 (Vite)

- `.env` 파일에 `KEY=value`를 두고, 코드에서는 `import.meta.env.KEY`로 읽는다.
- **`VITE_` 접두어가 붙은 것만** 브라우저 코드에 노출된다.
- 값은 **빌드 시점에 코드에 박힌다**. 배포 후 서버에서 바꿔도 이미 빌드된 파일은 안 바뀐다.
- 브라우저에 가는 값은 모두 공개된다 → **비밀키(API 시크릿, DB 비밀번호)를 `VITE_` 변수에 넣으면 안 된다.**

| 파일 | 로드 시점 | git |
|---|---|---|
| `.env` | 항상 | 커밋 가능(비밀 없는 기본값) |
| `.env.development` | `npm run dev` | 커밋 가능 |
| `.env.production` | `npm run build` | 커밋 가능 |
| `.env.local`, `.env.*.local` | 개인 설정·비밀 | **커밋 금지** (`.gitignore`) |
| `.env.example` | 변수 목록 예시 | 커밋 |

---

## 🛠️ 실기

### 실습 1. 목표 폴더 구조

```
project/
├─ .env.example
├─ .env.development
├─ src/
│  ├─ main.js
│  ├─ App.vue
│  ├─ config/env.js          # 환경변수를 한 곳에서 읽기
│  ├─ api/
│  │  ├─ client.js           # request(), ApiError  (study6)
│  │  ├─ auth.js
│  │  └─ posts.js            # (study6)
│  ├─ composables/
│  │  ├─ useAsync.js         # loading/error/data 공통화
│  │  └─ useDebounce.js
│  ├─ stores/                # auth.js, favorites.js
│  ├─ utils/format.js        # 날짜·숫자 포맷
│  ├─ components/            # AppHeader, PostCard, ...
│  ├─ router/index.js
│  └─ views/
```

### 실습 2. 환경변수 분리

```bash
# .env.example  (커밋한다. 실제 값은 .env.local에 복사해서 채운다)
VITE_API_BASE_URL=
VITE_APP_TITLE=Mini Board
```

```bash
# .env.development
VITE_API_BASE_URL=
VITE_APP_TITLE=Mini Board (dev)
```

```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=Mini Board
```

```js
// src/config/env.js
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'Mini Board',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
```

```js
// src/api/client.js 상단 수정
import { env } from '../config/env.js'
const BASE_URL = env.apiBaseUrl
```

| 줄 | 설명 |
|---|---|
| `.env.example` | "이 프로젝트에 필요한 변수 목록" 문서 역할 |
| 개발: `VITE_API_BASE_URL=` (빈 값) | 상대 경로 `/api`로 호출 → Vite 프록시 사용 ([study6](./study6.md)) |
| 운영: 실제 API 주소 | `npm run build` 때 코드에 삽입됨 |
| `import.meta.env.DEV` / `PROD` | Vite가 제공하는 불리언 (`mode`에 따라 결정) |
| `config/env.js` 한 곳에서만 읽기 | 변수 이름이 바뀌어도 한 파일만 수정 |

`.gitignore`에 아래가 있는지 확인합니다 (create-vue가 기본 포함).

```
*.local
```

### 실습 3. `useAsync` — loading/error/data 공통화

```js
// src/composables/useAsync.js
import { ref } from 'vue'

export function useAsync(fn) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, run }
}
```

사용 (Before / After):

```js
// Before: 화면마다 반복
const loading = ref(false); const errorMessage = ref(''); const posts = ref([])
async function fetchPosts() { loading.value = true; try { ... } catch { ... } finally { ... } }

// After
const { data: result, loading, error, run: load } = useAsync(() => listPosts({ q: keyword.value }))
onMounted(load)
```

| 줄 | 설명 |
|---|---|
| `useAsync(fn)` | 비동기 함수 `fn`을 받아 상태 3종을 만들어 돌려준다 |
| `run(...args)` | 호출 시 상태를 자동 관리. 인자를 `fn`으로 전달 |
| `return { data, loading, error, run }` | 호출한 곳에서 구조분해해 사용 (반환된 것이 `ref`라 반응성 유지) |

### 실습 4. `useDebounce` — 입력이 멈춘 뒤에만 반응

```js
// src/composables/useDebounce.js
import { ref, watch, onUnmounted } from 'vue'

export function useDebouncedRef(source, delay = 300) {
  const debounced = ref(source.value)
  let timer
  watch(source, (v) => {
    clearTimeout(timer)
    timer = setTimeout(() => (debounced.value = v), delay)
  })
  onUnmounted(() => clearTimeout(timer))
  return debounced
}
```

```js
const keyword = ref('')
const debouncedKeyword = useDebouncedRef(keyword, 300)
watch(debouncedKeyword, load)       // 타이핑이 300ms 멈췄을 때만 API 호출
```

### 실습 5. `@` 별칭과 `utils`

`vite.config.js`에 이미 `'@'` → `src`가 설정되어 있습니다. 깊은 상대 경로를 정리합니다.

```js
// Before
import { useAuthStore } from '../../stores/auth.js'
// After
import { useAuthStore } from '@/stores/auth.js'
```

```js
// src/utils/format.js
export const formatDate = (iso) =>
  new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
```

API가 주는 `createdAt`(ISO 8601 UTC)을 지역 시간으로 바꿔 화면에 보여줍니다.

### 실습 6. 앱 제목 적용

```js
// main.js
import { env } from '@/config/env.js'
document.title = env.appTitle
```

### 실행 확인

1. `npm run dev` → 탭 제목이 `Mini Board (dev)`
2. `npm run build && npm run preview` → 탭 제목이 `Mini Board`
3. `.env.local`에 `VITE_APP_TITLE=내 컴퓨터`를 추가 → 개발 서버 재시작 후 제목이 바뀌는지 (`.local`이 우선)
4. `git status`에 `.env.local`이 **나타나지 않는지** 확인

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `import.meta.env.MY_KEY`가 `undefined` | `VITE_` 접두어 누락 | `VITE_MY_KEY` |
| `.env` 수정했는데 반영 안 됨 | dev 서버는 시작 시에만 읽음 | dev 서버 재시작 |
| 배포했는데 API 주소가 개발용 | 빌드 시점의 값이 박힘 | 빌드 환경에서 `.env.production` 또는 `VITE_*` 주입 ([study17](./study17.md)) |
| `.env.local`이 git에 올라감 | `.gitignore` 누락 | `*.local` 추가, 이미 올라갔다면 키 폐기·교체 |
| `useAsync` 결과를 구조분해했더니 `.value`가 필요 | `ref`를 반환하므로 스크립트에서는 `.value` 필요 | 템플릿에서는 자동 언랩 |
| composable 안 `onMounted` 경고: `onMounted is called when there is no active component instance` | `setup` 밖(예: 이벤트 핸들러 안)에서 composable 호출 | composable은 `setup` 최상단에서 호출 |
| 순환 import (`stores/auth` ↔ `router`) | 스토어가 라우터를, 라우터가 스토어를 import | 가드 안에서 `useAuthStore()`를 지연 호출하거나 공통 함수를 별도 파일로 |
| `@/...` 경로를 에디터가 못 찾음 | `jsconfig.json`에 별칭 미등록 | `"paths": { "@/*": ["./src/*"] }` 확인 |

---

## ☐ 체크리스트

- ☑ `views` / `components` / `stores` / `router` 폴더를 역할별로 분리 (현재 구조)
- ☐ `api/`, `composables/`, `config/`, `utils/` 폴더 추가
- ☐ `.env.example`, `.env.development`, `.env.production` 작성, `.env.local`은 git 제외
- ☐ `config/env.js` 하나에서만 `import.meta.env` 읽기
- ☐ `useAsync` composable로 loading/error/data 중복 제거
- ☐ `useDebouncedRef`로 검색 요청 횟수 줄이기 (Network 탭에서 비교)
- ☐ `VITE_` 변수에 **비밀키를 넣으면 안 되는 이유**를 설명할 수 있다

## ➡️ 다음 단계 연결

구조가 정리되었으니 **정상 동작을 자동으로 보증**할 차례입니다. [study9](./study9.md)에서 Vitest 단위 테스트와 DevTools 디버깅을 다룹니다.
