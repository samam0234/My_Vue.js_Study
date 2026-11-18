<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listPosts } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'
import Pagination from '@/components/Pagination.vue'
import StateMessage from '@/components/StateMessage.vue'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { useDebouncedRef } from '@/composables/useDebounce'
import { useLatestRequest } from '@/composables/useLatestRequest'
import type { Page, Post } from '@/types/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()

// study4·study11: 검색어와 페이지는 URL 에 둔다 (새로고침·공유해도 유지).
const keyword = ref(String(route.query.q ?? ''))
const page = ref(Math.max(1, Number(route.query.page) || 1))
const showOnlyFavorites = ref(false)
const debouncedKeyword = useDebouncedRef(keyword, 300)

const result = ref<Page<Post> | null>(null)
const loading = ref(true) // 첫 렌더에서 "결과 없음"이 잠깐 보이지 않게
const error = ref<Error | null>(null)
const latest = useLatestRequest()

async function load() {
  loading.value = true
  error.value = null
  try {
    // 새 요청이 시작되면 이전 요청은 취소되어 undefined 를 돌려준다 (경쟁 상태 방지).
    const res = await latest((signal) =>
      listPosts({ q: debouncedKeyword.value, page: page.value, signal }),
    )
    if (res) {
      result.value = res
      loading.value = false
    }
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(String(err))
    loading.value = false
  }
}

onMounted(load)

watch(debouncedKeyword, () => {
  page.value = 1 // 검색어가 바뀌면 1페이지부터 (페이지가 남아 있으면 빈 결과가 나온다)
  syncUrl()
  load()
})
watch(page, () => {
  syncUrl()
  load()
})

function syncUrl() {
  router.replace({
    query: {
      ...(debouncedKeyword.value ? { q: debouncedKeyword.value } : {}),
      ...(page.value > 1 ? { page: String(page.value) } : {}),
    },
  })
}

// 서버가 검색·페이지를 처리하므로, 즐겨찾기 필터만 화면에서 적용한다.
const posts = computed(() => {
  const list = result.value?.data ?? []
  return showOnlyFavorites.value ? list.filter((p) => favorites.isFavorite(p.id)) : list
})

function handleToggleFavorite(postId: number) {
  if (!auth.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favorites.toggle(postId)
}
</script>

<template>
  <section>
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <label for="search" class="sr-only">제목·본문 검색</label>
      <input
        id="search"
        v-model="keyword"
        type="search"
        placeholder="제목·본문으로 검색..."
        class="min-w-52 flex-1 rounded-md border border-slate-300 bg-white p-2 text-sm"
      />
      <label class="flex items-center gap-1 whitespace-nowrap text-sm">
        <input v-model="showOnlyFavorites" type="checkbox" />
        즐겨찾기만 보기
      </label>
    </div>

    <StateMessage
      :loading="loading && !result"
      :error="error"
      :empty="posts.length === 0"
      empty-text="조건에 맞는 게시글이 없습니다."
      @retry="load"
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" :class="{ 'opacity-60': loading }">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          :is-favorite="favorites.isFavorite(post.id)"
          @toggle-favorite="handleToggleFavorite(post.id)"
        />
      </div>
    </StateMessage>

    <Pagination v-if="result" v-model:page="page" :total-pages="result.meta.totalPages" />
  </section>
</template>
