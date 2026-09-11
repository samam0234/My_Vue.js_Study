<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useFavoritesStore } from '../stores/favorites.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()

const post = ref(null)
const comments = ref([])
const loading = ref(false)
const errorMessage = ref('')

async function fetchPostDetail(id) {
  loading.value = true
  errorMessage.value = ''
  post.value = null

  try {
    const [postRes, commentsRes] = await Promise.all([
      fetch(`https://jsonplaceholder.typicode.com/posts/${id}`),
      fetch(`https://jsonplaceholder.typicode.com/posts/${id}/comments`),
    ])

    if (!postRes.ok) throw new Error(`게시글을 찾을 수 없습니다 (HTTP ${postRes.status})`)

    post.value = await postRes.json()
    comments.value = commentsRes.ok ? await commentsRes.json() : []
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

// 처음 마운트될 때 한 번 로드
onMounted(() => fetchPostDetail(route.params.id))

// 상세 페이지에서 다른 글로 바로 이동하는 경우를 대비해 id 변화도 감시
watch(
  () => route.params.id,
  (newId) => fetchPostDetail(newId),
)

function toggleFavorite() {
  if (!authStore.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favoritesStore.toggle(Number(route.params.id))
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <section class="post-detail">
    <button class="back-btn" @click="goBack">← 목록으로</button>

    <div v-if="loading" class="state">⏳ 불러오는 중...</div>

    <div v-else-if="errorMessage" class="state error">
      ⚠️ {{ errorMessage }}
    </div>

    <template v-else-if="post">
      <div class="post-header">
        <h2>{{ post.title }}</h2>
        <button
          class="favorite-btn"
          :class="{ active: favoritesStore.isFavorite(post.id) }"
          @click="toggleFavorite"
        >
          {{ favoritesStore.isFavorite(post.id) ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
        </button>
      </div>
      <p class="body">{{ post.body }}</p>

      <h3>댓글 {{ comments.length }}개</h3>
      <ul class="comments">
        <li v-for="comment in comments" :key="comment.id">
          <strong>{{ comment.name }}</strong>
          <span class="email">({{ comment.email }})</span>
          <p>{{ comment.body }}</p>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.post-detail {
  padding: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 1.5rem;
}

.state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.state.error {
  color: #d9534f;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.post-header h2 {
  text-transform: capitalize;
  margin-top: 0;
}

.favorite-btn.active {
  color: #f0ad4e;
  border-color: #f0ad4e;
}

.body {
  color: #444;
  line-height: 1.6;
}

.comments {
  list-style: none;
  padding: 0;
}

.comments li {
  border-top: 1px solid #eee;
  padding: 0.75rem 0;
}

.comments .email {
  color: #999;
  font-size: 0.85rem;
}

.comments p {
  margin: 0.35rem 0 0;
  color: #555;
  font-size: 0.9rem;
}
</style>
