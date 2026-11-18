<script setup>
import { formatDate } from '../utils/format.js'

// study2: 데이터를 바꾸지 않고 "눌렸다"고만 알린다. 로그인 확인은 부모가 한다.
defineProps({
  post: { type: Object, required: true },
  isFavorite: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-favorite'])

function handleFavoriteClick(event) {
  event.preventDefault() // RouterLink 의 페이지 이동을 막고 즐겨찾기만 토글
  event.stopPropagation()
  emit('toggle-favorite')
}
</script>

<template>
  <RouterLink :to="{ name: 'post-detail', params: { id: post.id } }" class="card card-box">
    <button
      type="button"
      class="star"
      :aria-label="isFavorite ? '즐겨찾기 해제' : '즐겨찾기'"
      @click="handleFavoriteClick"
    >
      {{ isFavorite ? '★' : '☆' }}
    </button>
    <h3>{{ post.title }}</h3>
    <p>{{ post.body.slice(0, 60) }}{{ post.body.length > 60 ? '…' : '' }}</p>
    <p class="muted">{{ post.author.nickname }} · {{ formatDate(post.createdAt) }} · 댓글 {{ post.commentCount }}</p>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  position: relative;
  text-decoration: none;
  color: inherit;
}
.card:hover {
  border-color: #999;
}
h3 {
  margin: 0 2rem 0.5rem 0;
}
.star {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: none;
  font-size: 1.25rem;
}
</style>
