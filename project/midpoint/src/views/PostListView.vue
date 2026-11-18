<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listPosts } from '../api/posts.js'
import { useAsync } from '../composables/useAsync.js'
import { useDebouncedRef } from '../composables/useDebounce.js'
import { useAuthStore } from '../stores/auth.js'
import { useFavoritesStore } from '../stores/favorites.js'
import PostCard from '../components/PostCard.vue'
import StateMessage from '../components/StateMessage.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()

// study4: 검색어와 페이지는 URL 에 둔다 (새로고침·공유해도 유지)
const keyword = ref(String(route.query.q ?? ''))
const page = ref(Math.max(1, Number(route.query.page) || 1))
const showOnlyFavorites = ref(false)
const debounced = useDebouncedRef(keyword, 300)

const { data: result, loading, error, run: load } = useAsync(() =>
  listPosts({ q: debounced.value, page: page.value }),
)

onMounted(load)
watch(debounced, () => {
  page.value = 1 // 검색어가 바뀌면 1페이지부터
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
      ...(debounced.value ? { q: debounced.value } : {}),
      ...(page.value > 1 ? { page: String(page.value) } : {}),
    },
  })
}

// 서버가 검색·페이지를 처리하고, 즐겨찾기 필터만 화면에서 적용한다
const posts = computed(() => {
  const list = result.value?.data ?? []
  return showOnlyFavorites.value ? list.filter((p) => favorites.isFavorite(p.id)) : list
})

function handleToggleFavorite(id) {
  if (!auth.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favorites.toggle(id)
}
</script>

<template>
  <section>
    <div class="toolbar">
      <label class="sr-only" for="search">제목·본문 검색</label>
      <input id="search" v-model="keyword" type="search" placeholder="제목·본문으로 검색..." />
      <label class="fav-filter"><input v-model="showOnlyFavorites" type="checkbox" /> 즐겨찾기만 보기</label>
    </div>

    <StateMessage
      :loading="loading && !result"
      :error="error"
      :empty="posts.length === 0"
      empty-text="조건에 맞는 게시글이 없습니다."
      @retry="load"
    >
      <div class="grid">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          :is-favorite="favorites.isFavorite(post.id)"
          @toggle-favorite="handleToggleFavorite(post.id)"
        />
      </div>
    </StateMessage>

    <nav v-if="result && result.meta.totalPages > 1" class="pager" aria-label="페이지 이동">
      <button :disabled="page <= 1" @click="page -= 1">이전</button>
      <span>{{ page }} / {{ result.meta.totalPages }}</span>
      <button :disabled="page >= result.meta.totalPages" @click="page += 1">다음</button>
    </nav>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}
.fav-filter {
  white-space: nowrap;
  font-size: 0.9rem;
}
.fav-filter input {
  width: auto;
}
.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
