<script setup>
import { products } from '../data/products.js'
</script>

<template>
  <section class="list-view">
    <h2>상품 목록</h2>
    <p class="desc">
      카드를 클릭하면 <code>/products/:id</code> 형태의 상세 페이지로 이동합니다.
      실제로 URL이 바뀌는지 주소창을 확인해보세요.
    </p>

    <ul>
      <li v-for="product in products" :key="product.id">
        <!-- RouterLink: <a> 태그를 대체, 새로고침 없이 라우팅만 바뀜 -->
        <RouterLink :to="`/products/${product.id}`" class="card">
          <h3>{{ product.name }}</h3>
          <p>{{ product.price.toLocaleString() }}원</p>
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
