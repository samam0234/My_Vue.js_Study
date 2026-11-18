# study12 — 성능 최적화

> 🎯 **목표**: "느낌"이 아니라 **측정**(Lighthouse·번들 분석·DevTools Performance)으로 병목을 찾고, 렌더링·네트워크·번들을 최적화한 뒤 **다시 측정**해 효과를 숫자로 확인한다.

- 이전: [study11](./study11.md) 상태·데이터 흐름
- 원칙: **측정 → 가설 → 변경 1개 → 재측정.** 측정 없이 하는 최적화는 복잡도만 늘린다.
- 구현 위치: [`project/final/vite.config.ts`](./project/final/vite.config.ts)(`build:analyze`, 벤더 청크 분리), `useDebounce`, 라우트 지연 로딩
- Lighthouse 는 아직 측정하지 않았습니다. 기록표의 빈 칸은 직접 측정해서 채웁니다.

---

## 📖 이론

### 12.1 무엇을 측정하나

| 지표 | 의미 | 좋은 기준(대략) |
|---|---|---|
| **LCP** (Largest Contentful Paint) | 가장 큰 콘텐츠가 보이기까지 | 2.5초 이하 |
| **INP** (Interaction to Next Paint) | 클릭 후 화면이 반응하기까지 | 200ms 이하 |
| **CLS** (Cumulative Layout Shift) | 화면이 갑자기 밀리는 정도 | 0.1 이하 |
| 번들 크기 | 처음에 내려받는 JS 양 | 가능한 작게 (gzip 기준으로 판단) |
| TTFB / API 응답 | 서버 응답 시간 | 프론트 최적화로는 한계 — 서버·캐시 |

### 12.2 병목은 세 곳에 있다

```
네트워크 ── 큰 번들, 많은 요청, 느린 API, 큰 이미지
   │
   ▼
스크립트 실행 ── 초기 JS 파싱·실행, 긴 작업(Long Task)
   │
   ▼
렌더링 ── 불필요한 재렌더, 큰 리스트(DOM 수천 개), 레이아웃 흔들림
```

### 12.3 Vue에서 자주 쓰는 최적화 도구

| 도구 | 용도 |
|---|---|
| 라우트 지연 로딩 `() => import()` | 초기 번들 축소 (이미 적용) |
| `defineAsyncComponent` | 무거운 컴포넌트(에디터·차트)를 필요할 때 로드 |
| `computed` | 파생 값 캐시 (이미 사용) |
| `shallowRef` / `shallowReactive` | 깊은 반응성 추적이 필요 없는 큰 데이터 |
| `v-once` / `v-memo` | 다시 그릴 필요 없는 부분 고정 |
| `v-show` vs `v-if` | 자주 토글되면 `v-show` |
| 디바운스 / 스로틀 | 입력·스크롤 이벤트 폭주 완화 |
| 가상 스크롤 | 수천 행 목록 |
| 이미지 `loading="lazy"`, 적절한 크기/형식 | 네트워크 절약 |
| `manualChunks`, 압축(gzip/brotli) | 번들 분할·전송량 감소 |

---

## 🛠️ 실기

### 실습 1. 기준선 측정 (최적화 전에 반드시)

1. 운영 빌드로 측정한다 — **개발 서버가 아니라**:
   ```bash
   npm run build && npm run preview     # http://localhost:4173
   ```
2. Chrome → 시크릿 창 → DevTools → **Lighthouse** → Performance(모바일) 실행. 3회 실행해 중앙값 기록.
3. `npm run build` 출력의 파일별 크기 기록.
4. Network 탭: `Disable cache` 체크 + `Slow 4G` 스로틀링으로 첫 로딩 시간·요청 수 기록.

**측정 기록표 (직접 채우기)**

| 항목 | 최적화 전 | 변경 내용 | 최적화 후 |
|---|---|---|---|
| Lighthouse Performance 점수 |  |  |  |
| LCP |  |  |  |
| 초기 JS 크기(gzip) |  |  |  |
| 초기 요청 수 |  |  |  |
| 목록 100개 렌더 시간 |  |  |  |

### 실습 2. 번들 분석 — 무엇이 큰가

```bash
npm install -D rollup-plugin-visualizer
```

```js
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false }),
  ],
})
```

`npm run build` 후 `dist/stats.html`을 열면 모듈별 크기가 사각형 지도로 보입니다. 가장 큰 사각형이 1순위 대상입니다.

### 실습 3. 번들 분할 — 변하지 않는 라이브러리를 따로

Vite 8 은 번들러로 **rolldown** 을 쓰므로 Rollup 의 `manualChunks` 대신 `rolldownOptions.output.codeSplitting` 을 씁니다.

```ts
// vite.config.ts
build: {
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: [
          {
            name(id: string) {
              return /node_modules[\\/](vue|@vue|vue-router|pinia)[\\/]/.test(id) ? 'vue-vendor' : null
            },
          },
        ],
      },
    },
  },
},
```

효과(이 저장소 실측, gzip): 앱 코드 `index-*.js` **4.6KB** + `vue-vendor-*.js` **37.9KB**. 앱 코드만 고쳐 재배포해도 `vue-vendor-*.js` 는 해시가 같아 **브라우저 캐시를 재사용**합니다. 적용 후에는 반드시 `npm run build` 출력에서 청크가 실제로 나뉘었는지 확인하세요(설정이 무시되어도 오류가 나지 않습니다).

### 실습 4. 무거운 컴포넌트 지연 로딩

```js
import { defineAsyncComponent } from 'vue'

const MarkdownEditor = defineAsyncComponent(() => import('@/components/MarkdownEditor.vue'))
```

```vue
<MarkdownEditor v-if="editing" />   <!-- 편집을 시작할 때만 파일을 내려받는다 -->
```

### 실습 5. 렌더링 — 큰 목록과 `shallowRef`

100~1000개 항목을 가진 목록에서 상태를 갱신할 때:

```js
import { shallowRef } from 'vue'

const posts = shallowRef([])                 // 배열 내부를 깊게 추적하지 않는다
posts.value = (await listPosts()).data       // 교체(.value 대입)할 때만 갱신 감지
```

- 대가: `posts.value[0].title = 'x'`처럼 **내부 변경은 화면에 반영되지 않는다.** 항상 새 배열/객체로 교체한다 (읽기 전용 목록에 적합).

`v-memo`로 조건이 같으면 하위 트리를 다시 그리지 않게 합니다.

```vue
<PostCard
  v-for="p in posts"
  :key="p.id"
  v-memo="[p.id, p.updatedAt, favorites.isFavorite(p.id)]"
  :post="p"
/>
```

`v-memo`의 배열이 이전과 같으면 그 항목은 렌더링을 건너뜁니다. 배열에 **화면에 영향을 주는 값을 빠짐없이** 넣어야 합니다(빠뜨리면 갱신이 안 되는 버그).

### 실습 6. 입력 이벤트 줄이기 (study8의 `useDebouncedRef`)

Network 탭에서 `검색어 5글자 입력` 시 요청 수가 5회 → 1회로 줄었는지 기록표에 적습니다.

### 실습 7. 이미지·정적 자산

```html
<img :src="post.thumbnail" width="240" height="160" loading="lazy" alt="" />
```

- `width`/`height` 지정 → 로딩 중 레이아웃이 밀리지 않아 **CLS 감소**
- `loading="lazy"` → 화면 밖 이미지는 나중에 요청
- 큰 PNG는 WebP/AVIF로 변환

### 실습 8. 전송 압축과 캐시 헤더 (배포 쪽)

Nginx 예시 ([study17](./study17.md)의 컨테이너에서 사용):

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;

location /assets/ {
  expires 1y;
  add_header Cache-Control "public, immutable";   # 해시 파일명이라 영구 캐시 가능
}
location = /index.html {
  add_header Cache-Control "no-cache";            # 항상 최신 index.html 확인
}
```

### 실습 9. Vue DevTools Performance로 렌더링 병목 확인

DevTools → Performance 탭에서 목록 필터링을 녹화 → 컴포넌트 렌더 시간이 긴 항목, Long Task(50ms 초과) 확인. 렌더가 잦은 컴포넌트에 `v-memo`/`computed` 적용 후 다시 녹화합니다.

### 실행 확인

1. 기록표의 "최적화 전/후"를 모두 채웠는가
2. **변경 하나당 재측정**을 했는가 (한 번에 여러 개를 바꾸면 효과를 알 수 없다)
3. `dist/stats.html`에서 가장 큰 모듈이 줄었거나 분리되었는가
4. 기능은 그대로인가 (`npm run test:run` 통과)

---

## ⚠️ 오류 노트

> 실제로 겪은 함정: 청크 분리 설정을 넣었는데 효과가 없다면, **같은 폴더에 낡은 `vite.config.js` 가 남아 있는지** 먼저 확인하세요. `.js` 와 `.ts` 가 함께 있으면 `.js` 가 우선해서 `.ts` 설정(플러그인·청크·프록시)이 통째로 무시됩니다 ([study14](./study14.md)).

| 증상 | 원인 | 해결 |
|---|---|---|
| 개발 서버에서 측정한 점수가 매우 낮음 | dev는 최적화 안 된 코드 | `build` + `preview`로 측정 |
| 점수가 실행마다 크게 다름 | 확장 프로그램·캐시·CPU 부하 | 시크릿 창, 3회 중앙값 |
| `shallowRef` 목록 수정이 화면에 안 보임 | 내부 변경은 추적 안 됨 | 새 배열로 교체: `posts.value = posts.value.map(...)` |
| `v-memo` 사용 후 값이 갱신 안 됨 | 의존 값을 배열에서 누락 | 화면에 쓰이는 모든 값을 배열에 포함 |
| 청크 분할 후 `vendor`가 오히려 커짐/순환 경고 | 분할 규칙이 거칠다 | 패키지 단위로 분할, 필요 최소한만 |
| 지연 로딩한 컴포넌트가 깜빡임 | 로드 지연 | `defineAsyncComponent({ loader, loadingComponent })` |
| 배포 후 이전 JS를 계속 불러옴 | `index.html`까지 오래 캐시됨 | `index.html`은 `no-cache`, `assets/`만 장기 캐시 |
| 조기 최적화로 코드가 복잡해짐 | 병목이 아닌 곳을 최적화 | 기록표로 **효과가 숫자로 확인된 것만 유지** |

---

## ☐ 체크리스트

- ☐ `build` + `preview` 환경에서 Lighthouse 기준선 측정(3회 중앙값)
- ☑ `rollup-plugin-visualizer`로 가장 큰 모듈 확인 — `npm run build:analyze` → `dist/stats.html`
- ☐ 최소 3가지 최적화 적용 (예: 청크 분할, 디바운스, 이미지 lazy/크기 지정)
- ☐ 각 변경마다 재측정하고 기록표를 채움
- ☐ 라우트 지연 로딩과 `defineAsyncComponent`의 차이를 설명
- ☐ `shallowRef`/`v-memo`의 주의점(내부 변경 미추적, 의존 값 누락)을 설명
- ☐ 해시 파일명 + `immutable` 캐시, `index.html` `no-cache`의 이유를 설명
- ☐ 최적화 후에도 테스트가 통과

## ➡️ 다음 단계 연결

직접 만들던 기능(UI·폼·날짜·HTTP)을 **검증된 라이브러리**로 대체하면 더 빠르게 만들 수 있습니다. [study13](./study13.md)에서 생태계 라이브러리를 연동합니다.
