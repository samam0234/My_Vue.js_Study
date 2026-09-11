# study3 — 컴포넌트 `props` / `emit`

study2까지는 컴포넌트 하나 안에서 반응형 상태를 다뤘습니다.
이제 화면을 **여러 컴포넌트로 쪼개고**, 그 컴포넌트들끼리 데이터를 주고받는 방법을 배웁니다.

```
- [x] Vue 3 + Vite 프로젝트 생성                  (study1)
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if  (study1)
- [x] ref, reactive, computed, watch             (study2)
- [x] 컴포넌트 props / emit                       (study3 — 이번 문서)
- [ ] Vue Router (목록 → 상세)
- [ ] 폼 검증
- [ ] fetch로 API 호출
- [ ] Pinia로 로그인 상태 공유 (선택)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 컴포넌트란, 왜 쪼개는가

study0 4.1절에서 짚었듯, 컴포넌트는 재사용 가능한 UI 조각입니다. 실습에서 만든 "과일 재고 목록", "computed 실습" 등도 전부 컴포넌트였지만, 지금까지는 **컴포넌트 하나가 모든 데이터와 로직을 다 가지고** 있었습니다.

실제 앱에서는 "상품 카드 하나"처럼 작은 단위를 별도 컴포넌트로 분리하고, 그 카드를 여러 개 반복해서 씁니다. 이때 필요한 게 **부모 → 자식 데이터 전달(props)**과 **자식 → 부모 이벤트 알림(emit)**입니다.

## 2. 단방향 데이터 흐름 복습

study0 4.2절 원칙을 다시 강조합니다.

> 데이터는 부모 → 자식으로만 내려간다. 자식은 부모 데이터를 직접 바꾸지 않고, "이런 일이 있었다"고 알리기만 한다.

이 원칙을 어기면(자식이 props를 직접 수정하면) Vue가 콘솔에 경고를 띄웁니다. 데이터가 어디서 바뀌는지 추적하기 어려워지는 걸 막기 위한 규칙입니다.

## 3. 실습: 상품 카드 컴포넌트

### 3.1 자식 컴포넌트 — `ProductCard.vue`

```vue
<script setup>
defineProps({
  product: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select', 'toggle-favorite'])

function handleClick() {
  emit('select')
}

function handleFavoriteClick(event) {
  event.stopPropagation()
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

**짚어볼 부분:**

- `defineProps({ product: { type: Object, required: true }, ... })`: 이 컴포넌트가 어떤 데이터를 "받기만" 하는지 명세. `type`, `required`, `default` 등을 지정하면 Vue가 개발 중에 타입 체크를 해줍니다 (틀리면 콘솔 경고).
- `defineEmits(['select', 'toggle-favorite'])`: 이 컴포넌트가 발생시킬 수 있는 커스텀 이벤트 목록. 미리 선언해두면 어떤 이벤트가 나가는지 문서화되는 효과도 있습니다.
- `product.favorite`를 카드 안에서 직접 토글하지 **않고** `emit('toggle-favorite')`만 호출 — 실제 값 변경은 부모 책임.
- `event.stopPropagation()`: 즐겨찾기 버튼 클릭이 카드 전체의 `@click`(select)까지 같이 발생시키지 않도록 이벤트 버블링을 막음. (네이티브 DOM 이벤트 객체를 그대로 받아쓸 수 있다는 점도 확인)

### 3.2 부모 컴포넌트 — `PropsEmitPractice.vue`

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

const selectedProduct = computed(() =>
  products.value.find((p) => p.id === selectedId.value) || null,
)

function selectProduct(id) {
  selectedId.value = id
}

function toggleFavorite(id) {
  const product = products.value.find((p) => p.id === id)
  if (product) product.favorite = !product.favorite
}
</script>

<template>
  <div v-for="product in products" :key="product.id">
    <ProductCard
      :product="product"
      :is-selected="product.id === selectedId"
      @select="selectProduct(product.id)"
      @toggle-favorite="toggleFavorite(product.id)"
    />
  </div>
</template>
```

**짚어볼 부분:**

- `products`(원본 데이터)는 **부모만** 갖고 있음. 자식에게는 `:product="product"`로 각 항목만 내려줌 (props, 내려가는 흐름).
- `@select="selectProduct(product.id)"`: 자식이 `emit('select')`를 호출하면 부모의 `selectProduct` 함수가 실행됨 (emit, 올라오는 흐름).
- `is-selected` (kebab-case) ↔ `isSelected` (camelCase): Vue는 HTML 속성 이름이 대소문자를 구분하지 않기 때문에, 템플릿에서 props를 넘길 때는 보통 kebab-case를 쓰고 `defineProps` 안에서는 camelCase로 선언합니다. 둘 다 같은 프로퍼티를 가리킵니다.
- `toggleFavorite`처럼 **실제 데이터 변경 로직은 전부 부모에** 있음 — 자식(`ProductCard`)은 "화면을 어떻게 보여줄지"만 책임지는 순수한 표현 컴포넌트(presentational component)입니다.

## 4. 실행 확인

```bash
cd demo
npm run dev
```

- 카드 클릭 → 선택된 카드에 테두리 강조, 아래 "선택된 상품" 영역 갱신 (`select` emit 확인)
- 별표(☆/★) 클릭 → 카드 선택 상태는 안 바뀌고 즐겨찾기만 토글, "즐겨찾기한 상품" 개수 갱신 (`toggle-favorite` emit + `stopPropagation` 확인)
- 브라우저 콘솔에 props 타입 경고가 없는지 확인 (`product`를 객체가 아닌 값으로 잘못 넘기면 경고가 뜸)

## 5. props/emit vs 그냥 전역 변수를 쓰면 안 되나?

"그냥 부모/자식이 같은 변수를 공유하면 안 되나?"라는 의문이 들 수 있습니다. 실제로 Vue는 부모 → 자식으로 `reactive` 객체를 그대로 넘기면 자식이 그 객체 내부를 직접 수정하는 것도 (JS 특성상) 막지는 않습니다. 하지만:

- **props를 직접 수정하면 경고가 뜨고, 데이터가 어디서 바뀌는지 추적하기 어려워집니다.**
- 컴포넌트가 커질수록 "이 값이 어디서 바뀌는지" 역추적하는 비용이 커집니다.
- emit 패턴을 쓰면 "이 컴포넌트가 무슨 이벤트를 낼 수 있는지"가 `defineEmits` 목록으로 명확히 문서화됩니다.

규모가 작을 때는 체감이 안 되지만, 컴포넌트 트리가 깊어질수록 이 규칙이 유지보수를 훨씬 쉽게 만들어줍니다.

---

## 다음 단계 (study4 예정)

- Vue Router로 "상품 목록 페이지"와 "상품 상세 페이지"를 분리
- 목록에서 카드를 클릭하면 실제 URL이 바뀌면서 상세 페이지로 이동 (지금은 같은 페이지 안에서 `selectedProduct`로만 표현했던 것을 라우팅으로 확장)
