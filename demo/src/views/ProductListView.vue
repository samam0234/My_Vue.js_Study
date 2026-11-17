<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { products } from '../data/products.js'
import { formatPrice } from '../utils/format.js'

// study4 실습 5: 검색어를 URL 쿼리(?q=)에 둔다. 새로고침하거나 주소를 공유해도 유지된다.
const route = useRoute()
const router = useRouter()
const keyword = ref(String(route.query.q ?? ''))

watch(keyword, (q) => {
  router.replace({ query: q ? { q } : {} })
})

const filtered = computed(() =>
  products.filter((p) => p.name.includes(keyword.value.trim())),
)
</script>

<template>
  <section class="list-view">
    <h2>상품 목록</h2>
    <p class="desc">
      카드를 클릭하면 <code>/products/:id</code> 형태의 상세 페이지로 이동합니다.
      실제로 URL이 바뀌는지 주소창을 확인해보세요.
    </p>

    <input v-model="keyword" type="search" placeholder="상품명 검색" aria-label="상품명 검색" />

    <p v-if="filtered.length === 0" class="empty">검색 결과가 없습니다.</p>
    <ul v-else>
      <li v-for="product in filtered" :key="product.id">
        <!-- RouterLink: <a> 태그를 대체, 새로고침 없이 라우팅만 바뀜 -->
        <RouterLink :to="`/products/${product.id}`" class="card">
          <h3>{{ product.name }}</h3>
          <p>{{ formatPrice(product.price) }}</p>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list-view {
  padding: 1rem 0;
}

.desc {
  font-size: 0.9rem;
  color: #666;
}

input {
  margin: 0.5rem 0;
}

.empty {
  color: #999;
}

ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.card {
  display: block;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s;
}

.card:hover {
  border-color: #999;
}

.card h3 {
  margin: 0 0 0.5rem 0;
}

.card p {
  margin: 0;
  color: #666;
}
</style>
