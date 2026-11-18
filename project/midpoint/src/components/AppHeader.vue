<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { env } from '../config/env.js'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'post-list' })
}
</script>

<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'post-list' }" class="brand">📝 {{ env.appTitle }}</RouterLink>
    <nav>
      <RouterLink :to="{ name: 'post-list' }">게시글</RouterLink>
      <RouterLink v-if="auth.isLoggedIn" :to="{ name: 'post-new' }">글쓰기</RouterLink>
    </nav>
    <div class="auth">
      <template v-if="auth.isLoggedIn">
        <span data-testid="current-user">👤 {{ auth.user.nickname }}님</span>
        <button @click="handleLogout">로그아웃</button>
      </template>
      <template v-else>
        <span class="muted">로그인하지 않음</span>
        <RouterLink :to="{ name: 'login' }">로그인</RouterLink>
        <RouterLink :to="{ name: 'signup' }">회원가입</RouterLink>
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.brand {
  font-weight: 700;
  text-decoration: none;
  color: #222;
}
nav {
  flex: 1;
  display: flex;
  gap: 1rem;
}
.auth {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}
</style>
