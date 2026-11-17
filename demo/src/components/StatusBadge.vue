<script setup>
// study2 실습 3: 재고 상태 배지. type 에 따라 색이 바뀌고, 안의 글자는 슬롯으로 받는다.
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
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
}
.success {
  background: #dcfce7;
  color: #166534;
}
.warn {
  background: #fef9c3;
  color: #854d0e;
}
.danger {
  background: #fee2e2;
  color: #991b1b;
}
</style>
