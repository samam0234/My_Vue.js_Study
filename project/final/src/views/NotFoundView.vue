<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="py-16 text-center" data-testid="not-found">
    <p class="text-5xl font-bold text-slate-300">404</p>
    <p class="mt-3 text-slate-600">요청한 페이지를 찾을 수 없습니다.</p>
    <RouterLink :to="{ name: 'post-list' }" class="mt-4 inline-block">목록으로 돌아가기</RouterLink>
  </section>
</template>
