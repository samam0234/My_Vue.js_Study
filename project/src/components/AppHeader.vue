<script setup>
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="brand">📝 Mini Board</RouterLink>

    <nav>
      <RouterLink to="/">게시글</RouterLink>
      <RouterLink v-if="!authStore.isLoggedIn" to="/login">로그인</RouterLink>
    </nav>

    <div class="auth-status">
      <span v-if="authStore.isLoggedIn">
        👤 {{ authStore.user.name }}님
        <button @click="authStore.logout()">로그아웃</button>
      </span>
      <span v-else class="guest">로그인하지 않음</span>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.brand {
  font-weight: 700;
  text-decoration: none;
  color: inherit;
  font-size: 1.1rem;
}

nav {
  display: flex;
  gap: 1rem;
  flex: 1;
}

nav a {
  text-decoration: none;
  color: var(--color-text);
}

nav a.router-link-exact-active {
  font-weight: 700;
  color: #3b82f6;
}

.auth-status {
  font-size: 0.9rem;
  color: #555;
}

.auth-status .guest {
  color: #999;
}

.auth-status button {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}
</style>
