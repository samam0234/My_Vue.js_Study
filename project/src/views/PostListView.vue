<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PostCard from '../components/PostCard.vue'
import { useAuthStore } from '../stores/auth.js'
import { useFavoritesStore } from '../stores/favorites.js'

const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()

const posts = ref([])
const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const showOnlyFavorites = ref(false)

async function fetchPosts() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=12')
    if (!res.ok) throw new Error(`게시글을 불러오지 못했습니다 (HTTP ${res.status})`)
    posts.value = await res.json()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchPosts)

// 검색어 + 즐겨찾기 필터를 함께 적용한 목록
const filteredPosts = computed(() => {
  return posts.value
    .filter((post) => post.title.includes(keyword.value.trim()))
    .filter((post) => !showOnlyFavorites.value || favoritesStore.isFavorite(post.id))
})

// 검색어가 바뀔 때마다 몇 건이 검색됐는지 콘솔에 로그 (watch 실습)
watch(keyword, (newVal) => {
  if (newVal) {
    console.log(`"${newVal}" 검색 결과: ${filteredPosts.value.length}건`)
  }
})

function handleToggleFavorite(postId) {
  if (!authStore.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favoritesStore.toggle(postId)
}
</script>

<template>
  <section class="post-list">
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="제목으로 검색..." />
      <label>
        <input v-model="showOnlyFavorites" type="checkbox" />
        즐겨찾기만 보기
      </label>
    </div>

    <div v-if="loading" class="state">⏳ 게시글을 불러오는 중입니다...</div>

    <div v-else-if="errorMessage" class="state error">
      ⚠️ {{ errorMessage }}
      <button @click="fetchPosts">다시 시도</button>
    </div>

    <div v-else-if="filteredPosts.length === 0" class="state empty">
      조건에 맞는 게시글이 없습니다.
    </div>

    <div v-else class="grid">
      <PostCard
        v-for="post in filteredPosts"
        :key="post.id"
        :post="post"
        :is-favorite="favoritesStore.isFavorite(post.id)"
        @toggle-favorite="handleToggleFavorite(post.id)"
      />
    </div>
  </section>
</template>

<style scoped>
.post-list {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.5rem;
}

.toolbar input[type='text'] {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
}

.toolbar label {
  font-size: 0.9rem;
  white-space: nowrap;
}

.state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.state.error {
  color: #d9534f;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
</style>
