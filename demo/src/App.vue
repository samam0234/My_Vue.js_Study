<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { useAuthStore } from './stores/auth.js'

// study7: 어느 컴포넌트에서 useAuthStore()를 호출하든 같은 스토어 인스턴스를 공유합니다.
// 로그인 폼에서 로그인에 성공하면, 여기 헤더에도 즉시 반영됩니다.
const authStore = useAuthStore()
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <p class="auth-status">
        <span v-if="authStore.isLoggedIn">
          👤 {{ authStore.user.name }}님 반갑습니다
          <button @click="authStore.logout()">로그아웃</button>
        </span>
        <span v-else class="guest">로그인하지 않은 상태입니다</span>
      </p>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/products">상품 목록</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

.auth-status {
  text-align: center;
  font-size: 0.85rem;
  color: #555;
}

.auth-status .guest {
  color: #999;
}

.auth-status button {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
