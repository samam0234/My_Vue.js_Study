<script setup>
import { ref, computed } from 'vue'
import ProductCard from './ProductCard.vue'

// 부모가 데이터의 "원본"을 가지고 있습니다. 자식은 이 데이터를 받아서 보여주기만 합니다.
const products = ref([
  { id: 1, name: '무선 키보드', price: 45000, favorite: false },
  { id: 2, name: '모니터 암', price: 32000, favorite: true },
  { id: 3, name: '노트북 거치대', price: 18000, favorite: false },
])

const selectedId = ref(null)

const selectedProduct = computed(() =>
  products.value.find((p) => p.id === selectedId.value) || null,
)

const favoriteCount = computed(() => products.value.filter((p) => p.favorite).length)

// 자식(ProductCard)의 emit('select')를 받아서, 실제 데이터 변경은 부모가 수행
function selectProduct(id) {
  selectedId.value = id
}

// 자식(ProductCard)의 emit('toggle-favorite')를 받아서 처리
function toggleFavorite(id) {
  const product = products.value.find((p) => p.id === id)
  if (product) product.favorite = !product.favorite
}
</script>

<template>
  <section class="practice">
    <h2>컴포넌트 props / emit 실습</h2>
    <p class="desc">
      상품 데이터는 <strong>이 부모 컴포넌트</strong>가 갖고 있고, 각 카드(자식 컴포넌트
      <code>ProductCard</code>)에는 <code>props</code>로만 내려줍니다. 카드를 클릭하거나
      별표를 누르면 자식은 직접 데이터를 바꾸지 않고 <code>emit</code>으로 부모에게 알리기만
      합니다.
    </p>

    <p>즐겨찾기한 상품: <strong>{{ favoriteCount }}개</strong></p>

    <div class="grid">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :is-selected="product.id === selectedId"
        @select="selectProduct(product.id)"
        @toggle-favorite="toggleFavorite(product.id)"
      />
    </div>

    <div class="detail" v-if="selectedProduct">
      <h3>선택된 상품</h3>
      <p>{{ selectedProduct.name }} — {{ selectedProduct.price.toLocaleString() }}원</p>
    </div>
    <p v-else class="detail empty">카드를 클릭하면 선택된 상품이 여기 표시됩니다.</p>
  </section>
</template>

<style scoped>
.practice {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.desc {
  font-size: 0.9rem;
  color: #666;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}

.detail {
  border-top: 1px dashed #ddd;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.detail.empty {
  color: #999;
  font-style: italic;
}
</style>
