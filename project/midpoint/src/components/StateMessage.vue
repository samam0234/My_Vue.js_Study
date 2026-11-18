<script setup>
// study6: loading / error / empty 를 한 곳에서 표시하고, 아니면 slot 을 보여 준다.
defineProps({
  loading: Boolean,
  error: { type: Object, default: null },
  empty: Boolean,
  emptyText: { type: String, default: '표시할 내용이 없습니다.' },
})
defineEmits(['retry'])
</script>

<template>
  <div v-if="loading" class="state" role="status">⏳ 불러오는 중입니다...</div>
  <div v-else-if="error" class="state error-state" role="alert">
    <p>⚠️ {{ error.message }}</p>
    <p v-if="error.requestId" class="muted">요청 번호: {{ error.requestId }}</p>
    <button type="button" @click="$emit('retry')">다시 시도</button>
  </div>
  <div v-else-if="empty" class="state">{{ emptyText }}</div>
  <slot v-else />
</template>
