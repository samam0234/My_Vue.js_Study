<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/config/env'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'post-list' })
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">
      <RouterLink :to="{ name: 'post-list' }" class="text-lg font-bold text-slate-800 no-underline">
        📝 {{ env.appTitle }}
      </RouterLink>

      <nav class="flex flex-1 gap-4 text-sm" aria-label="주 메뉴">
        <RouterLink :to="{ name: 'post-list' }">게시글</RouterLink>
        <RouterLink v-if="auth.isLoggedIn" :to="{ name: 'post-new' }">글쓰기</RouterLink>
      </nav>

      <div class="flex items-center gap-3 text-sm">
        <template v-if="auth.isLoggedIn">
          <span data-testid="current-user">👤 {{ auth.user?.nickname }}님</span>
          <button type="button" class="text-slate-500 hover:text-slate-800" @click="handleLogout">
            로그아웃
          </button>
        </template>
        <template v-else>
          <span class="text-slate-400">로그인하지 않음</span>
          <RouterLink :to="{ name: 'login' }">로그인</RouterLink>
          <RouterLink :to="{ name: 'signup' }">회원가입</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>
