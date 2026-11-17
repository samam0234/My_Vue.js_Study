<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <AppHeader />
  <main class="mx-auto max-w-4xl px-4 py-6">
    <!-- 라우트가 바뀌면 오류 상태를 초기화하려고 key 를 준다 -->
    <ErrorBoundary :key="route.fullPath">
      <RouterView />
    </ErrorBoundary>
  </main>
</template>
