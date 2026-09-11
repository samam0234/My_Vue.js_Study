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

// 이 컴포넌트는 데이터를 직접 바꾸지 않고, 부모에게 "이런 일이 있었다"고만 알립니다.
const emit = defineEmits(['select', 'toggle-favorite'])

function handleClick() {
  emit('select')
}

function handleFavoriteClick(event) {
  event.stopPropagation() // 카드 클릭(select)과 별개로 동작하게
  emit('toggle-favorite')
}
</script>

<template>
  <article class="card" :class="{ selected: isSelected }" @click="handleClick">
    <button class="favorite-btn" :class="{ active: product.favorite }" @click="handleFavoriteClick">
      {{ product.favorite ? '★' : '☆' }}
    </button>
    <h4>{{ product.name }}</h4>
    <p class="price">{{ product.price.toLocaleString() }}원</p>
  </article>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s;
}

.card:hover {
  border-color: #999;
}

.card.selected {
  border-color: var(--color-border-hover, #f0ad4e);
  background: rgba(240, 173, 78, 0.08);
}

.card h4 {
  margin: 0.25rem 0;
}

.price {
  color: #666;
  margin: 0;
}

.favorite-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #ccc;
}

.favorite-btn.active {
  color: #f0ad4e;
}
</style>
