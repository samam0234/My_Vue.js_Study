<script setup>
defineProps({
  post: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
})

// study3에서 배운 패턴: 이 컴포넌트는 데이터를 직접 바꾸지 않고 emit만 함
const emit = defineEmits(['toggle-favorite'])

function handleFavoriteClick(event) {
  event.preventDefault() // RouterLink 클릭(페이지 이동)을 막고 즐겨찾기만 토글
  event.stopPropagation()
  emit('toggle-favorite')
}
</script>

<template>
  <RouterLink :to="`/posts/${post.id}`" class="card">
    <button class="favorite-btn" :class="{ active: isFavorite }" @click="handleFavoriteClick">
      {{ isFavorite ? '★' : '☆' }}
    </button>
    <h3>{{ post.title }}</h3>
    <p>{{ post.body.slice(0, 60) }}...</p>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s;
}

.card:hover {
  border-color: #999;
}

.card h3 {
  margin: 0.25rem 2rem 0.5rem 0;
  font-size: 1rem;
  text-transform: capitalize;
}

.card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.favorite-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  border: none;
  background: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #ccc;
}

.favorite-btn.active {
  color: #f0ad4e;
}
</style>
