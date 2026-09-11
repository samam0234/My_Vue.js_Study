# study4 — Vue Router (목록 → 상세)

study3에서 컴포넌트를 쪼개는 법을 배웠으니, 이번엔 **페이지를 쪼개는 법**을 배웁니다.
지금까지는 모든 실습이 홈 화면 한 페이지 안에 쌓여 있었는데, 이제 "상품 목록" 페이지와 "상품 상세" 페이지를 실제 URL로 분리합니다.

```
- [x] Vue 3 + Vite 프로젝트 생성
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if
- [x] ref, reactive, computed, watch
- [x] 컴포넌트 props / emit
- [x] Vue Router (목록 → 상세)                    (study4 — 이번 문서)
- [ ] 폼 검증
- [ ] fetch로 API 호출
- [ ] Pinia로 로그인 상태 공유 (선택)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 복습: SPA에서 라우팅이 필요한 이유

study0 5.1절에서 설명했듯, SPA는 페이지 이동 시 서버에 새 HTML을 요청하지 않습니다. 대신 Vue Router가 **주소창의 URL을 감시**하다가, URL이 바뀌면 그에 맞는 컴포넌트로 화면 일부(`<RouterView>` 자리)를 교체합니다.

study1의 프로젝트 생성 시 `--router` 옵션을 켰기 때문에 이미 `vue-router`가 설치되어 있고, `src/router/index.js`에 기본 라우트(`/`, `/about`)가 있었습니다. 이번엔 여기에 `/products`(목록), `/products/:id`(상세)를 추가합니다.

## 2. 목업 데이터 준비

라우팅 자체에 집중하기 위해, API 호출(study6에서 다룰 예정) 대신 정적 배열을 씁니다.

```js
// src/data/products.js
export const products = [
  { id: 1, name: '무선 키보드', price: 45000, description: '...' },
  { id: 2, name: '모니터 암', price: 32000, description: '...' },
  { id: 3, name: '노트북 거치대', price: 18000, description: '...' },
]

export function findProductById(id) {
  return products.find((p) => p.id === Number(id))
}
```

목록 페이지와 상세 페이지가 **같은 데이터 소스**를 `import`해서 씁니다 — 데이터 중복을 피하기 위한 흔한 패턴입니다.

## 3. 라우트 설정 추가

```js
// src/router/index.js
{
  path: '/products',
  name: 'product-list',
  component: () => import('../views/ProductListView.vue'),
},
{
  // :id 는 동적 파라미터. '/products/1', '/products/2' 등에 매칭됨
  path: '/products/:id',
  name: 'product-detail',
  component: () => import('../views/ProductDetailView.vue'),
},
```

- `() => import('../views/...')`: study1에서 본 기본 라우트(`/about`)와 같은 패턴 — **지연 로딩(lazy loading)**. 해당 라우트에 처음 방문할 때만 그 컴포넌트의 코드를 다운로드합니다. 앱이 커질수록 초기 로딩 속도에 유리합니다.
- `:id`: 콜론으로 시작하는 부분은 "동적 세그먼트". `/products/1`, `/products/abc` 등 뭐가 오든 매칭되고, 그 값은 `route.params.id`로 읽을 수 있습니다.

## 4. 목록 페이지 — `ProductListView.vue`

```vue
<script setup>
import { products } from '../data/products.js'
</script>

<template>
  <ul>
    <li v-for="product in products" :key="product.id">
      <RouterLink :to="`/products/${product.id}`" class="card">
        <h3>{{ product.name }}</h3>
        <p>{{ product.price.toLocaleString() }}원</p>
      </RouterLink>
    </li>
  </ul>
</template>
```

- `<RouterLink :to="...">`: study0 5.3절에서 배운 `<a>` 태그 대체 컴포넌트. `:to`에 동적으로 경로 문자열을 만들어 바인딩 — `v-bind`(study1)와 라우터가 결합된 형태입니다.
- 클릭하면 **새로고침 없이** URL만 `/products/1`로 바뀌고 `<RouterView>` 안의 컴포넌트가 교체됩니다.

## 5. 상세 페이지 — `ProductDetailView.vue`

```vue
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findProductById } from '../data/products.js'

const route = useRoute()
const router = useRouter()

const product = computed(() => findProductById(route.params.id))

function goBack() {
  router.push('/products')
}
</script>

<template>
  <button @click="goBack">← 목록으로</button>

  <div v-if="product">
    <h2>{{ product.name }}</h2>
    <p>{{ product.price.toLocaleString() }}원</p>
    <p>{{ product.description }}</p>
  </div>
  <div v-else>
    <p>id "{{ route.params.id }}"에 해당하는 상품을 찾을 수 없습니다.</p>
  </div>
</template>
```

### `useRoute()` vs `useRouter()` — 헷갈리기 쉬운 이름 구분

| 함수 | 반환하는 것 | 용도 |
|---|---|---|
| `useRoute()` | **현재** 라우트의 정보 (읽기 전용) | `route.params.id`, `route.query`, `route.path` 등을 읽을 때 |
| `useRouter()` | 라우터 **조작** 도구 | `router.push('/products')`처럼 코드로 페이지 이동시킬 때 |

이 컴포넌트에서는 두 가지를 함께 씁니다:
- `route.params.id`로 URL의 `:id` 부분을 읽어서 `computed`로 해당 상품을 찾음 (`findProductById`가 `Number(id)`로 변환하는 이유: URL 파라미터는 항상 문자열이라서)
- `router.push('/products')`로 "← 목록으로" 버튼 클릭 시 `<RouterLink>` 없이도 코드로 이동

### `product`를 `computed`로 만든 이유

`route.params.id`가 바뀌면(예: 상세 페이지에서 다른 상품 링크로 바로 이동) `product`도 자동으로 다시 계산되어야 하므로, study2에서 배운 `computed`를 그대로 활용했습니다. 이렇게 여러 study의 개념이 자연스럽게 겹쳐서 쓰이는 걸 확인할 수 있습니다.

## 6. 없는 id로 접근했을 때 (예외 처리)

`v-if="product"` / `v-else`로 분기해서, 존재하지 않는 id(`/products/999`)로 접근하면 "찾을 수 없습니다" 안내와 목록으로 돌아가는 링크를 보여줍니다. 실무에서는 이럴 때 보통 404 페이지로 리다이렉트하지만, 지금은 간단하게 안내 문구로 처리했습니다.

## 7. `App.vue` 내비게이션에 링크 추가

```vue
<nav>
  <RouterLink to="/">Home</RouterLink>
  <RouterLink to="/about">About</RouterLink>
  <RouterLink to="/products">상품 목록</RouterLink>
</nav>
```

## 8. 실행 확인

```bash
cd demo
npm run dev
```

- 상단 네비게이션의 "상품 목록" 클릭 → `/products`로 이동, 카드 3개가 보이는지
- 카드 클릭 → 주소창이 `/products/1` 등으로 바뀌고 상세 내용이 보이는지 (새로고침 없이!)
- "← 목록으로" 버튼 클릭 → `/products`로 돌아가는지 (`router.push` 확인)
- 브라우저 뒤로가기 버튼 → 정상적으로 이전 페이지로 이동하는지 (브라우저 히스토리 연동 확인)
- 주소창에 직접 `/products/999` 입력 → "찾을 수 없습니다" 문구가 보이는지

---

## 다음 단계 (study5 예정)

- 폼 검증: study3의 상품 데이터를 활용해 "리뷰 작성 폼" 등을 만들며 클라이언트 사이드 검증 익히기
- 이후 study6에서 실제 fetch로 API를 호출하는 흐름까지 연결
