<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { findProductById } from '../data/products.js'

// useRoute(): 현재 라우트 정보(파라미터, 쿼리스트링 등)를 읽는 함수
const route = useRoute()
// useRouter(): 코드로 페이지 이동을 시키고 싶을 때 사용하는 라우터 인스턴스
const router = useRouter()

// route.params.id 는 라우트 설정의 ':id' 부분과 매칭됨 (항상 문자열)
const product = computed(() => findProductById(route.params.id))

function goBack() {
  router.push('/products') // 코드로 이동: router-link 없이도 페이지 전환 가능
}
</script>

<template>
  <section class="detail-view">
    <button @click="goBack">← 목록으로</button>

    <div v-if="product">
      <h2>{{ product.name }}</h2>
      <p class="price">{{ product.price.toLocaleString() }}원</p>
      <p>{{ product.description }}</p>
      <p class="meta">URL 파라미터로 받은 id: <code>{{ route.params.id }}</code></p>
    </div>

    <div v-else class="not-found">
      <p>id "{{ route.params.id }}"에 해당하는 상품을 찾을 수 없습니다.</p>
      <RouterLink to="/products">목록으로 돌아가기</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.detail-view {
  padding: 1rem 0;
}

button {
  margin-bottom: 1rem;
}

.price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
}

.meta {
  font-size: 0.85rem;
  color: #888;
  margin-top: 1rem;
}

.not-found {
  color: #999;
}
</style>
