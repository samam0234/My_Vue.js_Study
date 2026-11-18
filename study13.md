# study13 — 생태계 라이브러리

> 🎯 **목표**: Vue 프로젝트에서 많이 쓰는 UI·유틸 라이브러리(Tailwind CSS, VueUse, dayjs, axios, UI 컴포넌트 라이브러리)를 **필요한 만큼만** 연동하고, 도입 기준을 세운다.

- 이전: [study12](./study12.md) 성능 최적화 (번들 크기가 도입 비용의 기준)
- 구현 위치: `project/final/` — Tailwind(`@tailwindcss/vite`), VueUse(`stores/favorites.ts`), dayjs(`utils/format.ts`), `AppButton`·`FormField` 래퍼. **axios·Element Plus 는 도입하지 않았습니다**(아래 체크리스트 참고).
- 설치 전 각 패키지의 최신 문서에서 설정 방식을 확인하세요.

---

## 📖 이론

### 13.1 라이브러리 도입 판단 기준

| 질문 | 기준 |
|---|---|
| 직접 만드는 비용이 큰가? | 날짜 처리, 접근성 있는 모달·드롭다운은 **직접 만들지 않는다** |
| 번들에 얼마나 더하는가? | [study12](./study12.md)의 visualizer로 **도입 전/후 크기 비교** |
| 유지보수가 활발한가? | 최근 릴리스, 이슈 응답, Vue 3 공식 지원 여부 |
| 사용하는 부분만 가져올 수 있는가? | 트리 쉐이킹(ESM, 개별 import, 자동 import) |
| 교체가 쉬운가? | 화면 곳곳에 퍼지지 않게 **얇은 래퍼**로 감싼다 |

### 13.2 분류와 대표 선택지

| 분류 | 대표 | 비고 |
|---|---|---|
| 유틸리티 CSS | Tailwind CSS | 클래스로 스타일링, 사용한 것만 CSS에 포함 |
| 컴포넌트 UI | Element Plus, PrimeVue, Vuetify, Naive UI | 테이블·모달·폼 등 완성형 |
| Composition 유틸 | **VueUse** | `useLocalStorage`, `useDebounceFn`, `useIntersectionObserver` 등 수백 개 |
| 날짜 | dayjs, date-fns | 가볍다 |
| HTTP | axios (또는 직접 만든 `fetch` 래퍼) | 인터셉터·취소·업로드 진행률 |
| 폼 검증 | VeeValidate, FormKit + zod/yup | 검증 규칙을 스키마로 |
| 아이콘 | unplugin-icons, lucide-vue-next | 쓰는 아이콘만 번들 |
| 차트 | Chart.js(vue-chartjs), ECharts | 크므로 **지연 로딩** |

이 문서에서는 **Tailwind + VueUse + dayjs + axios + Element Plus(자동 import)** 를 예로 연동합니다. 모두 쓸 필요는 없고, "필요한 것만" 고르는 연습입니다.

---

## 🛠️ 실기

### 실습 1. Tailwind CSS (v4 + Vite 플러그인)

```bash
npm install tailwindcss @tailwindcss/vite
```

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
})
```

```css
/* src/assets/main.css 맨 위 */
@import "tailwindcss";
```

사용:

```vue
<button class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
  저장
</button>
```

| 줄 | 설명 |
|---|---|
| `@tailwindcss/vite` | Vite 플러그인 방식 (v4부터 별도 `tailwind.config.js`·PostCSS 설정이 거의 필요 없다) |
| `@import "tailwindcss"` | Tailwind를 CSS에 포함. 템플릿에서 **실제로 쓴 클래스만** 결과에 들어간다 |
| 긴 클래스 반복 | 컴포넌트로 추출(`<AppButton>`)해서 한 곳에서만 관리 |

기존 `base.css`/`main.css`와 충돌(리셋 스타일 중복)이 생기면 한쪽으로 정리합니다.

### 실습 2. VueUse — 직접 짠 코드를 한 줄로

```bash
npm install @vueuse/core
```

```js
import { useLocalStorage, useDebounceFn, useEventListener } from '@vueuse/core'

// study3: watch + localStorage 직접 구현 → 한 줄
const favoriteIds = useLocalStorage('mini-board:favorites', [])

// study8: 직접 만든 디바운스 → 한 줄
const search = useDebounceFn(load, 300)

// 이벤트 등록/해제를 자동으로 (언마운트 시 해제)
useEventListener(window, 'keydown', (e) => { if (e.key === '/') searchInput.value?.focus() })
```

| 줄 | 설명 |
|---|---|
| `useLocalStorage(key, default)` | `ref`처럼 쓰는데 값이 바뀌면 `localStorage`에 자동 저장, 시작 시 자동 복원 |
| `useDebounceFn(fn, ms)` | 디바운스된 함수 반환 |
| `useEventListener` | `onUnmounted`에서 자동 해제 (해제 누락 버그 방지) |

**배울 점**: 직접 만들어 본 뒤(study3, 8) 라이브러리를 쓰면 내부 동작을 이해한 채 쓰게 된다.

### 실습 3. dayjs — 날짜

```bash
npm install dayjs
```

```js
// src/utils/format.js
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

export const fromNow = (iso) => dayjs(iso).fromNow()                 // "3시간 전"
export const formatDate = (iso) => dayjs(iso).format('YYYY.MM.DD HH:mm')
```

API의 `createdAt`(UTC ISO 8601)을 지역 시간으로 변환합니다. `locale/ko`와 플러그인은 **쓰는 것만** import해 번들을 작게 유지합니다.

### 실습 4. axios — `fetch` 래퍼를 대체할까?

```bash
npm install axios
```

```js
// src/api/axios.js
import axios from 'axios'
import { env } from '@/config/env.js'
import { useAuthStore } from '@/stores/auth.js'

export const http = axios.create({ baseURL: env.apiBaseUrl, timeout: 10_000 })

http.interceptors.request.use((config) => {
  const { token } = useAuthStore()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const e = err.response?.data?.error
    return Promise.reject(Object.assign(new Error(e?.message ?? err.message), {
      status: err.response?.status ?? 0,
      code: e?.code ?? (err.code === 'ERR_NETWORK' ? 'NETWORK' : 'UNKNOWN'),
      fields: e?.fields,
      requestId: e?.requestId,
    }))
  },
)
```

| 줄 | 설명 |
|---|---|
| `axios.create({ baseURL, timeout })` | 공통 설정. **타임아웃**을 지정할 수 있다 (`fetch`에는 기본 없음) |
| request interceptor | 모든 요청에 토큰 자동 첨부 (study7의 `authed`를 대체) |
| response interceptor | 오류를 `ApiError`와 같은 모양으로 변환. 호출부 코드는 그대로 |
| `useAuthStore()`를 인터셉터 **안에서** 호출 | Pinia 설치 이후 시점에 호출되도록 |

| 비교 | `fetch` 래퍼 (study6) | axios |
|---|---|---|
| 번들 | 0 | 추가됨 |
| 인터셉터, 타임아웃, 업로드 진행률 | 직접 구현 | 기본 제공 |
| 결론 | 단순하면 충분 | 요구가 늘면 도입 |

`api/*.js` 모듈의 **함수 시그니처를 그대로 두면** 내부 구현만 `request` → `http`로 바꿔도 화면 코드는 수정이 없습니다. (study8에서 API를 모듈로 분리한 이유)

### 실습 5. Element Plus — 컴포넌트 UI (자동 import)

```bash
npm install element-plus
npm install -D unplugin-vue-components unplugin-auto-import
```

```js
// vite.config.js
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
})
```

```vue
<template>
  <el-button type="primary" :loading="saving" @click="submit">저장</el-button>
  <el-table :data="posts">
    <el-table-column prop="title" label="제목" />
    <el-table-column prop="author.nickname" label="작성자" />
  </el-table>
</template>
```

| 줄 | 설명 |
|---|---|
| `ElementPlusResolver()` | 템플릿에서 쓴 `el-*` 컴포넌트만 자동으로 import → **전체 가져오기보다 번들이 작다** |
| `:loading="saving"` | study5의 중복 제출 방지를 컴포넌트 옵션으로 |

> `ElMessage`, `ElMessageBox`처럼 JS에서 부르는 함수는 스타일 import가 필요할 수 있다 (`unplugin-element-plus` 등). 해당 라이브러리 문서의 자동 import 안내를 따르세요.

**도입 후 반드시**: `visualizer`로 번들 증가량을 확인하고 [study12](./study12.md) 기록표에 적습니다.

### 실습 6. 래퍼로 감싸서 교체 가능하게

```vue
<!-- src/components/AppButton.vue : 화면은 이것만 쓴다 -->
<script setup>
defineProps({ loading: Boolean, variant: { type: String, default: 'primary' } })
</script>
<template>
  <el-button :type="variant" :loading="loading"><slot /></el-button>
</template>
```

나중에 UI 라이브러리를 바꿔도 `AppButton.vue` 한 곳만 수정하면 됩니다.

### 실행 확인

1. 각 라이브러리를 도입할 때마다 `npm run build` → 초기 JS 크기 변화를 기록
2. Tailwind: 쓰지 않는 클래스가 CSS 결과에 없는지 `dist/assets/*.css` 크기 확인
3. `useLocalStorage`: 새로고침 후에도 즐겨찾기가 남는지 (study3 실습과 동일 결과)
4. axios 교체 후 `npm run test:run`이 그대로 통과하는지 (스토어 테스트의 fetch mock은 수정 필요 — 구현을 바꾸면 테스트의 mock 지점도 바뀐다)

---

## ⚠️ 오류 노트

> 실제로 겪은 함정: Tailwind 플러그인을 `vite.config.ts` 에 넣었는데 유틸리티 CSS 가 하나도 만들어지지 않고 `@theme`/`@tailwind` 가 그대로 출력되며 minify 경고(`Unknown at rule`)가 떴다. 원인은 플러그인이 아니라 **낡은 `vite.config.js` 가 먼저 읽혀 `.ts` 설정이 통째로 무시된 것**이었다([study14](./study14.md)). 같은 증상이면 `ls vite.config.*` 부터 확인한다.

| 증상 | 원인 | 해결 |
|---|---|---|
| Tailwind 클래스가 적용 안 됨 | `@import "tailwindcss"` 누락 / 플러그인 미등록 | `main.css` 맨 위, `vite.config.js` 플러그인 확인 |
| 기존 CSS와 Tailwind 스타일이 충돌 | `base.css` 리셋이 중복 | 한쪽으로 통일 |
| `Failed to resolve component: el-button` | 자동 import 설정 미적용 | Resolver 설정·dev 서버 재시작, `components.d.ts` 생성 확인 |
| `ElMessage` 스타일이 안 보임 | 함수형 API는 컴포넌트 자동 import 대상이 아님 | 해당 문서의 스타일 자동 import 플러그인 사용 |
| 번들이 갑자기 수백 KB 증가 | 라이브러리 전체를 import | 개별/자동 import, 지연 로딩 |
| axios 인터셉터에서 `getActivePinia() ... no active Pinia` | 모듈 로드 시점에 스토어 호출 | 인터셉터 **함수 안에서** 호출 |
| 라이브러리 업데이트 후 화면이 깨짐 | 메이저 버전 변경 | `package-lock.json` 유지, 릴리스 노트 확인, 업데이트는 단독 커밋 |
| 같은 기능이 여러 라이브러리로 중복 (dayjs + date-fns) | 도입 기준 없음 | 분류별로 하나만 채택 |

---

## ☐ 체크리스트

- ☐ 도입 판단 기준 5가지를 말할 수 있다
- ☑ Tailwind CSS 연동, 컴포넌트 하나를 클래스로 스타일링 — `vite.config.ts` 플러그인 + `main.css` 의 `@import "tailwindcss"`
- ☑ VueUse `useLocalStorage`로 즐겨찾기 저장을 한 줄로 대체 — `stores/favorites.ts`
- ☑ dayjs로 `createdAt`을 "n시간 전"으로 표시 — `PostCard`, `PostDetailView`, `CommentSection`
- ☑ axios 인터셉터로 토큰 첨부·오류 변환 (또는 `fetch` 래퍼 유지 결정과 이유 기록) — **`fetch` 래퍼 유지로 결정** — 토큰 첨부·401 처리·오류 구조화는 `configureApi` 훅으로 충분하고 번들이 0이다. 타임아웃·업로드 진행률이 필요해지면 도입
- ☐ UI 라이브러리를 하나 연동하고 `AppButton` 같은 래퍼로 감쌌다 — `AppButton`·`FormField` 래퍼는 Tailwind 로 구현했다. Element Plus 같은 컴포넌트 라이브러리 연동은 하지 않았다
- ☐ 라이브러리 도입마다 번들 증가량을 측정해 기록했다

## ➡️ 다음 단계 연결

라이브러리가 늘수록 **타입과 정적 검사**가 중요해집니다. [study14](./study14.md)에서 TypeScript, ESLint, Prettier를 적용합니다.
