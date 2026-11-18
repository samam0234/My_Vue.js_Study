# study14 — TypeScript·타입·정적 분석

> 🎯 **목표**: 프로젝트에 TypeScript, `vue-tsc` 타입 검사, ESLint, Prettier를 적용해 **실행하기 전에** 오류를 잡는다.

- 이전: [study13](./study13.md) 생태계 라이브러리
- Notion 체크 항목: **TypeScript 도입**
- 구현 위치: [`project/final/`](./project/final) 전체 — `tsconfig.json`, `env.d.ts`, `src/types/api.ts`, `eslint.config.js`, `.prettierrc.json`. `demo/` 는 study0~10 범위라 JS 로 유지합니다.
- 버전 메모: 이 저장소는 TypeScript 6, ESLint 10, vue-tsc 3 입니다. TypeScript 6 에서는 `baseUrl` 이 deprecated 라 `paths` 만 둡니다(아래 반영).

---

## 📖 이론

### 14.1 왜 타입인가

```js
post.author.nickName   // 오타(실제는 nickname). JS는 실행해서 undefined가 돼야 안다.
```

TypeScript는 코드를 **실행하기 전에** "이 객체에는 `nickName`이 없다"고 알려 줍니다. 효과가 큰 곳: API 응답 모양, props/emit 계약, 스토어 state.

| 도구 | 하는 일 | 시점 |
|---|---|---|
| TypeScript (`tsc`/`vue-tsc`) | 타입 검사 | 개발 중(에디터) + CI |
| ESLint | 버그 가능성·규칙 위반 (미사용 변수, 잘못된 훅 사용) | 개발 중 + CI |
| Prettier | 코드 모양(들여쓰기·따옴표) 통일 | 저장 시 |
| **Volar** (Vue 공식 VS Code 확장) | `.vue` 안의 TS 지원 | 에디터 |

> Vite 자체는 TS를 **변환만** 하고 **타입 검사는 하지 않는다.** 타입 검사는 `vue-tsc`가 따로 한다 → 빌드 스크립트에 넣어야 의미가 있다.

### 14.2 점진적 도입

모든 파일을 한 번에 바꾸지 않아도 됩니다.

1. TS 환경 설정 + `allowJs: true`로 JS/TS 혼용
2. 가장 효과가 큰 곳부터: `api/` 타입 → 스토어 → 컴포넌트 props
3. 파일을 `.js` → `.ts`, `<script setup lang="ts">`로 하나씩 전환
4. 마지막에 `strict: true`

---

## 🛠️ 실기

### 실습 1. 설치와 설정

```bash
cd project/final
npm install -D typescript vue-tsc @types/node
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client", "node", "vitest/globals"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/**/*.js", "env.d.ts"]
}
```

```ts
// env.d.ts  — import.meta.env의 변수에 타입을 준다
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

```json
// package.json scripts
"type-check": "vue-tsc --noEmit",
"build": "npm run type-check && vite build"
```

| 줄 | 설명 |
|---|---|
| `strict: true` | null 가능성·암시적 any를 엄격히 검사 (처음엔 `false`로 시작해도 됨) |
| `allowJs: true` | 기존 `.js`와 새 `.ts` 혼용 |
| `noEmit: true` | 검사만 하고 파일은 만들지 않는다 (변환은 Vite) |
| `paths` | `@/` 별칭을 TS도 이해하게 (`vite.config`의 alias와 **둘 다** 필요) |
| `env.d.ts` | `import.meta.env.VITE_*` 오타를 잡아 준다 |
| `build`에 `type-check` 포함 | 타입 오류가 있으면 빌드가 실패 → 배포 전에 걸러짐 |

### 실습 2. API 타입 — 가장 먼저, 가장 효과가 큰 곳

공통 API 스펙 v1을 타입으로 옮깁니다.

```ts
// src/types/api.ts
export interface User {
  id: number
  email: string
  nickname: string
}

export interface Author {
  id: number
  nickname: string
}

export interface Post {
  id: number
  title: string
  body: string
  tags: string[]
  author: Author
  commentCount: number
  createdAt: string   // ISO 8601 UTC
  updatedAt: string
}

export interface Page<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number; q?: string }
}

export interface ApiErrorBody {
  code: string
  message: string
  fields?: Record<string, string[]>
  requestId?: string
}
```

```ts
// src/api/client.ts
import type { ApiErrorBody } from '@/types/api'

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string[]>
  requestId?: string

  constructor(status: number, body: Partial<ApiErrorBody> & { message: string }) {
    super(body.message)
    this.status = status
    this.code = body.code ?? 'UNKNOWN'
    this.fields = body.fields
    this.requestId = body.requestId
  }
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  // ... study6와 동일한 구현 ...
  return json as T
}
```

```ts
// src/api/posts.ts
import { request } from './client'
import type { Post, Page } from '@/types/api'

export const listPosts = (p: { q?: string; page?: number; limit?: number } = {}) =>
  request<Page<Post>>(`/api/posts?${new URLSearchParams({ page: '1', limit: '10', ...(p.q ? { q: p.q } : {}) })}`)

export const getPost = (id: number | string) =>
  request<{ data: Post }>(`/api/posts/${id}`).then((r) => r.data)
```

| 줄 | 설명 |
|---|---|
| `interface Post` | 서버가 주는 모양을 한 곳에 정의. 이후 `post.author.nickName` 오타가 **에디터에서 빨간 줄** |
| `Page<T>` | 제네릭 — 목록 응답 모양을 게시글/댓글 등에 재사용 |
| `request<T>()` | 호출하는 쪽이 반환 타입을 지정. 단, **런타임에 서버가 다른 모양을 주면 타입은 거짓말** → 검증 라이브러리(zod 등)로 보강 가능 |
| `unknown` | `any` 대신. 쓰기 전에 좁혀야 해서 안전 |

### 실습 3. 컴포넌트 props/emit 타입

```vue
<script setup lang="ts">
import type { Post } from '@/types/api'

const props = defineProps<{
  post: Post
  isFavorite?: boolean          // ? 는 선택(optional)
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite'): void
}>()
</script>
```

```vue
<script setup lang="ts">
// 기본값이 필요하면 withDefaults
const props = withDefaults(defineProps<{ post: Post; isFavorite?: boolean }>(), {
  isFavorite: false,
})
</script>
```

| 줄 | 설명 |
|---|---|
| `defineProps<{...}>()` | 런타임 선언(`{ type: Object }`) 대신 **타입으로** props 선언 |
| `defineEmits<{ (e: 'x'): void }>()` | 이벤트 이름과 인자를 타입으로 — 부모가 잘못된 이벤트를 들으면 오류 |
| `withDefaults` | 타입 기반 props의 기본값 |

### 실습 4. Pinia 스토어 타입

```ts
// src/stores/auth.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)         // 제네릭으로 ref 타입 지정
  const token = ref<string | null>(localStorage.getItem('mini-board:token'))

  const isLoggedIn = computed(() => !!token.value && user.value !== null)

  async function login(input: { email: string; password: string }): Promise<boolean> {
    // ...
    return true
  }

  return { user, token, isLoggedIn, login }
})
```

`ref<User | null>(null)` — "처음엔 `null`, 로그인하면 `User`"를 명시. 사용처에서 `user.value.nickname`을 쓰면 TS가 "`null`일 수 있다"고 경고 → `user.value?.nickname`.

### 실습 5. 점진 전환 순서 (체크하며 진행)

| 순서 | 대상 | 파일 변경 |
|---|---|---|
| 1 | `types/api.ts` 추가 | 신규 |
| 2 | `api/client`, `api/posts` | `.js` → `.ts` |
| 3 | `stores/auth`, `stores/favorites` | `.js` → `.ts` |
| 4 | `components/*.vue` | `<script setup lang="ts">` |
| 5 | `views/*.vue`, `router/index.ts` | 동일 |
| 6 | `allowJs: false`, 남은 JS 제거 | 마무리 |

각 단계 후 `npm run type-check`와 `npm run test:run`이 통과해야 다음으로 넘어갑니다.

### 실습 6. ESLint (flat config)

```bash
npm install -D eslint eslint-plugin-vue typescript-eslint @vue/eslint-config-typescript
```

```js
// eslint.config.js
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'coverage/**'] },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    rules: {
      'vue/multi-word-component-names': 'off',   // Home.vue 같은 한 단어 이름 허용 여부는 팀 결정
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
```

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

> `npm create vue@latest`에서 TypeScript·ESLint·Prettier를 선택하면 같은 구성의 파일을 자동 생성해 준다. 패키지/헬퍼 이름이 버전에 따라 바뀌므로, 새 프로젝트를 한 번 생성해 **생성된 설정을 기준으로 비교**하는 것이 가장 정확하다.

대표 규칙: 미사용 변수, `v-for` `:key` 누락(`vue/require-v-for-key`), `v-if`+`v-for` 동시 사용, props 직접 변경(`vue/no-mutating-props`).

### 실습 7. Prettier

```bash
npm install -D prettier eslint-config-prettier
```

```json
// .prettierrc.json
{ "semi": false, "singleQuote": true, "printWidth": 100, "trailingComma": "all" }
```

```json
"format": "prettier --write src/"
```

ESLint는 "버그", Prettier는 "모양"을 맡는다. 둘이 규칙으로 충돌하지 않도록 `eslint-config-prettier`로 포맷 관련 ESLint 규칙을 끕니다.

### 실습 8. 편집기 연동 (VS Code)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
}
```

권장 확장: **Vue (Official)**, ESLint, Prettier. (Vetur는 끈다.)

### 실행 확인

1. `post.author.nickName`처럼 일부러 오타를 내면 에디터에 오류가 뜨고, `npm run type-check`가 **실패**하는가
2. 미사용 변수를 만들면 `npm run lint`가 지적하는가
3. 들여쓰기를 망가뜨린 뒤 저장하면 Prettier가 정리하는가
4. 오류가 있는 상태에서 `npm run build`가 중단되는가 (`build`에 `type-check` 포함)

---

## ⚠️ 오류 노트

> **가장 큰 함정 — `vite.config.js` 와 `vite.config.ts` 가 함께 있으면 `.js` 가 먼저 읽힙니다.** JS → TS 전환 때 새 `vite.config.ts` 를 만들고 옛 `vite.config.js` 를 지우지 않으면, `.ts` 에 넣은 플러그인·프록시·청크 설정이 에러 없이 **통째로 무시**됩니다(Tailwind 유틸리티가 안 만들어지는 식으로 나타남). 전환할 때 `ls vite.config.*` 로 하나만 남았는지 확인하세요. (Vitest 는 `.ts` 를 읽어서 테스트는 통과하는데 빌드만 이상해지므로 더 찾기 어렵습니다.)

| 증상 | 원인 | 해결 |
|---|---|---|
| `.vue` 안에서 `Cannot find module './X.vue'` | `.vue` 타입 선언 없음 | `vue-tsc` + Volar 사용(타입 선언 shim 불필요), `include`에 `*.vue` 포함 |
| `Property 'env' does not exist on type 'ImportMeta'` | `vite/client` 타입 누락 | `types: ["vite/client"]`, `env.d.ts` |
| `Object is possibly 'null'` | `ref<User \| null>`의 값 접근 | `?.` 또는 `v-if="user"`로 좁히기 |
| `Type 'string' is not assignable to type 'number'` (`route.params.id`) | `params`는 문자열 | `Number(route.params.id)` |
| `defineProps` 타입 기반 선언에서 외부 타입 import가 안 됨 | 구버전 Vue | Vue 3.3+ 사용 (이 저장소는 3.5) |
| 에디터엔 오류 없는데 `vue-tsc`는 실패 | Volar는 열린 파일만 검사 | CI에서 `vue-tsc --noEmit` 전체 검사 |
| `any`가 퍼짐 | 외부 JSON을 `any`로 받음 | `unknown` + 검증, API 타입 정의 |
| ESLint ↔ Prettier가 서로 되돌림 | 포맷 규칙 충돌 | `eslint-config-prettier` 적용 |
| TS로 바꾸자 기존 테스트 import 경로 실패 | 확장자 변경(`.js`→`.ts`) | import는 확장자 없이 쓰거나 일괄 수정 |

---

## ☐ 체크리스트

- ☑ `typescript`, `vue-tsc`, `tsconfig.json`, `env.d.ts` 설정
- ☑ `npm run type-check` 스크립트, `build`에 연결 — `"build": "npm run type-check && vite build"`
- ☑ **TypeScript 도입 (Notion 체크 항목)**: `types/api.ts`로 API 응답 타입 정의 — `project/final/src/types/api.ts`
- ☑ `api/*`, `stores/*`를 TS로 전환 — `project/final/` 전체가 TS (`.vue` 는 `<script setup lang="ts">`)
- ☑ `defineProps<{}>()` / `defineEmits<{}>()` 타입 선언 적용
- ☑ ESLint(flat config) + `npm run lint` 통과 — `eslint-plugin-vue` + `@vue/eslint-config-typescript` + prettier skip-formatting
- ☑ Prettier + 저장 시 포맷 — `.prettierrc.json` (저장 시 포맷은 에디터 설정)
- ☐ "Vite는 타입 검사를 하지 않는다"를 설명할 수 있다
- ☐ 일부러 낸 타입 오류가 빌드에서 잡히는 것을 확인

## ➡️ 다음 단계 연결

정적 검사만으로는 동작을 보증하지 못합니다. [study15](./study15.md)에서 단위·통합·E2E 테스트를 갖추고 CI에서 자동 실행합니다.
