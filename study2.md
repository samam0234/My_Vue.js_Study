# study2 — 핵심 구조: 컴포넌트

> 🎯 **목표**: Vue의 기본 단위인 **컴포넌트**를 직접 만들고, `props`(부모→자식)와 `emit`(자식→부모)으로 데이터를 주고받는다.

- 이전: [study1](./study1.md) 기본 문법
- 대응 코드: [`demo/src/components/ProductCard.vue`](./demo/src/components/ProductCard.vue), [`PropsEmitPractice.vue`](./demo/src/components/PropsEmitPractice.vue), [`project/src/components/PostCard.vue`](./project/src/components/PostCard.vue)

---

## 📖 이론

### 2.1 컴포넌트란

화면을 **재사용 가능한 조각**으로 나눈 것입니다. Vue에서는 `*.vue` 파일(SFC) 하나가 컴포넌트 하나입니다. 쪼개는 이유는 세 가지입니다.

- **재사용**: 같은 카드를 여러 곳에서 쓴다.
- **읽기 쉬움**: 한 파일이 한 가지 일만 한다.
- **독립성**: 카드 안쪽 스타일·로직을 바꿔도 다른 곳에 영향이 없다 (`<style scoped>`).

### 2.2 단방향 데이터 흐름

```
부모 ──props(데이터)──▶ 자식
부모 ◀──emit(이벤트)─── 자식
```

- 자식은 받은 `props`를 **직접 수정하지 않는다.** (수정하면 `[Vue warn]` 경고)
- 바꾸고 싶으면 `emit`으로 "이런 일이 있었다"고 알리고, **실제 변경은 데이터를 가진 부모**가 한다.
- 이 규칙 덕분에 "데이터가 어디서 바뀌었는지" 추적이 쉽다.

### 2.3 컴포넌트 계약 선언

| 매크로 | 역할 |
|---|---|
| `defineProps({...})` | 받을 props의 이름·타입·필수 여부·기본값 선언 |
| `defineEmits([...])` | 내보낼 이벤트 이름 선언 |
| `defineModel()` | 부모와 `v-model`로 양방향 연결되는 prop+emit 한 쌍 (Vue 3.4+) |

이름 규칙: 컴포넌트 파일은 `PascalCase`(`ProductCard.vue`), 이벤트는 `kebab-case`(`toggle-favorite`), 템플릿에서 props는 `:is-selected`처럼 kebab-case로 써도 `isSelected`와 매칭됩니다.

---

## 🛠️ 실기

### 실습 1. 자식 컴포넌트 `ProductCard.vue`

```vue
<script setup>
defineProps({
  product: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'toggle-favorite'])

function handleClick() {
  emit('select')
}

function handleFavoriteClick(event) {
  event.stopPropagation() // 카드 클릭(select)과 분리
  emit('toggle-favorite')
}
</script>

<template>
  <article class="card" :class="{ selected: isSelected }" @click="handleClick">
    <button class="favorite-btn" @click="handleFavoriteClick">
      {{ product.favorite ? '★' : '☆' }}
    </button>
    <h4>{{ product.name }}</h4>
    <p>{{ product.price.toLocaleString() }}원</p>
  </article>
</template>
```

| 줄 | 설명 |
|---|---|
| `defineProps({ product: { type: Object, required: true } })` | 부모가 반드시 `product` 객체를 내려줘야 함. 안 주면 개발 모드에서 경고 |
| `isSelected: { type: Boolean, default: false }` | 선택 여부. 안 주면 `false` |
| `defineEmits(['select', 'toggle-favorite'])` | 이 컴포넌트가 내보낼 수 있는 이벤트 목록 |
| `emit('select')` | 부모에게 "카드가 클릭됐다"고 알림. 데이터는 바꾸지 않는다 |
| `event.stopPropagation()` | 별표 클릭이 바깥 카드의 `@click`까지 올라가 `select`가 같이 발생하는 것을 막음 |
| `product.price.toLocaleString()` | 45000 → `45,000` 형식으로 표시 |

### 실습 2. 부모 컴포넌트 `PropsEmitPractice.vue`

```vue
<script setup>
import { ref, computed } from 'vue'
import ProductCard from './ProductCard.vue'

const products = ref([
  { id: 1, name: '무선 키보드', price: 45000, favorite: false },
  { id: 2, name: '모니터 암', price: 32000, favorite: true },
  { id: 3, name: '노트북 거치대', price: 18000, favorite: false },
])
const selectedId = ref(null)

const favoriteCount = computed(() => products.value.filter((p) => p.favorite).length)

function toggleFavorite(id) {
  const product = products.value.find((p) => p.id === id)
  if (product) product.favorite = !product.favorite
}
</script>

<template>
  <p>즐겨찾기: {{ favoriteCount }}개</p>
  <ProductCard
    v-for="product in products"
    :key="product.id"
    :product="product"
    :is-selected="product.id === selectedId"
    @select="selectedId = product.id"
    @toggle-favorite="toggleFavorite(product.id)"
  />
</template>
```

| 줄 | 설명 |
|---|---|
| `import ProductCard from './ProductCard.vue'` | `<script setup>`에서는 import만 하면 템플릿에서 바로 컴포넌트로 사용 가능 |
| `ref([...])` | **데이터의 원본은 부모**가 가진다 |
| `:product="product"` | `v-bind` — 자식에게 props 전달 |
| `@toggle-favorite="toggleFavorite(product.id)"` | 자식이 `emit('toggle-favorite')`하면 부모의 함수 실행. 실제 데이터 변경은 여기서 |
| `computed(...)` | 즐겨찾기 개수는 `products`로부터 파생된 값 (study3) |

### 실습 3. 직접 만들어 보기 — `StatusBadge.vue` (슬롯 포함)

요구사항: 재고 상태를 알려주는 배지 컴포넌트. `type`(`success`/`warn`/`danger`)에 따라 색이 바뀌고, 안의 글자는 **슬롯**으로 받는다.

```vue
<!-- src/components/StatusBadge.vue -->
<script setup>
defineProps({
  type: {
    type: String,
    default: 'success',
    validator: (v) => ['success', 'warn', 'danger'].includes(v),
  },
})
</script>

<template>
  <span class="badge" :class="type"><slot>상태 없음</slot></span>
</template>

<style scoped>
.badge { padding: 2px 8px; border-radius: 999px; font-size: 0.8rem; }
.success { background: #dcfce7; color: #166534; }
.warn { background: #fef9c3; color: #854d0e; }
.danger { background: #fee2e2; color: #991b1b; }
</style>
```

사용:

```vue
<StatusBadge type="danger">품절</StatusBadge>
<StatusBadge>재고 있음</StatusBadge>
<StatusBadge />   <!-- 슬롯 기본값 "상태 없음" -->
```

- `<slot>`: 부모가 태그 사이에 넣은 내용이 들어가는 자리. 안의 글자는 기본값.
- `validator`: 허용되지 않은 값을 넣으면 개발 모드에서 경고.

### 실습 4. 종합 프로젝트에서의 쓰임 — `project/` PostCard

`PostCard.vue`는 카드 전체가 `<RouterLink>`라서 클릭하면 상세로 이동합니다. 안의 즐겨찾기 버튼만 이동을 막고 `emit`으로 부모에게 알립니다.

```vue
<script setup>
defineProps({ post: Object, isFavorite: Boolean })
const emit = defineEmits(['toggle-favorite'])

function handleFavoriteClick(event) {
  event.preventDefault()    // RouterLink의 페이지 이동 취소
  event.stopPropagation()
  emit('toggle-favorite')
}
</script>
```

로그인 확인 같은 **규칙은 부모(`PostListView`)가 담당**합니다. 자식은 "눌렸다"만 말합니다.

### 실행 확인

```bash
cd demo && npm run dev
```

1. 카드의 별표 클릭 → 즐겨찾기 개수가 바뀌는가 (부모 데이터 변경 → 자식 재렌더)
2. 카드 본문 클릭 → 선택 테두리와 "선택된 상품"이 바뀌는가
3. 별표를 눌렀을 때 선택이 **같이 바뀌지 않는가** (`stopPropagation` 확인)

---

## ⚠️ 오류 노트

| 증상 / 경고 | 원인 | 해결 |
|---|---|---|
| `[Vue warn]: Missing required prop: "product"` | 필수 prop을 안 내려줌 | 부모에서 `:product="..."` 전달 |
| `[Vue warn]: Attempting to mutate prop "xxx"` | 자식이 props를 직접 변경 | `emit`으로 부모에게 요청하거나 `ref(props.xxx)`로 복사해서 사용 |
| `[Vue warn]: Extraneous non-emits event listeners` | `defineEmits`에 없는 이벤트를 부모가 듣고 있음 | 이벤트 이름 선언/오타 확인 |
| `[Vue warn]: Failed to resolve component: XXX` | import를 안 했거나 파일명/대소문자 불일치 | `import` 경로와 PascalCase 확인 |
| props를 `ref`처럼 `.value`로 접근 | props는 `.value`가 필요 없음 (템플릿에서도, `props.xxx`도) | `props.product`로 접근 |
| 객체/배열 prop 기본값에 `default: []` | 모든 인스턴스가 같은 배열을 공유 | `default: () => []` 처럼 함수로 |
| 카드 안 버튼 클릭이 바깥 `@click`까지 실행 | 이벤트 버블링 | `@click.stop` 또는 `event.stopPropagation()` |

---

## ☐ 체크리스트

- ☑ 컴포넌트를 파일로 분리하고 `import`해서 사용
- ☑ `defineProps`로 타입·필수·기본값을 선언
- ☑ `defineEmits` + `emit`으로 자식→부모 알림, 실제 변경은 부모가 수행
- ☑ "자식은 props를 직접 바꾸지 않는다"를 설명할 수 있다
- ☑ `project/`의 `PostCard`에서 `RouterLink` 안 버튼의 이동 방지를 이해
- ☐ 실습 3: `StatusBadge.vue`(슬롯 + validator)를 직접 만들어 `demo/`에 붙이기
- ☐ `defineModel()`로 `v-model`이 되는 `SearchInput.vue` 만들어 보기

## ➡️ 다음 단계 연결

컴포넌트의 **데이터(상태)** 를 어떻게 다루는지 [study3](./study3.md)에서 `ref` / `reactive` / `computed` / `watch`로 정리합니다.
