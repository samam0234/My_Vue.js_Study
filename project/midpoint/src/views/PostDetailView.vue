<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, deletePost, listComments, createComment, deleteComment } from '../api/posts.js'
import { ApiError } from '../api/client.js'
import { useAsync } from '../composables/useAsync.js'
import { useAuthStore } from '../stores/auth.js'
import { useFavoritesStore } from '../stores/favorites.js'
import { formatDate } from '../utils/format.js'
import StateMessage from '../components/StateMessage.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()

const post = ref(null)
const comments = ref([])
const notFound = ref(false)
const actionMessage = ref('')
const draft = ref('')
const commentError = ref('')

const postId = computed(() => String(route.params.id))

const { loading, error, run: load } = useAsync(async () => {
  notFound.value = false
  post.value = null
  try {
    // study4: 본문과 댓글을 동시에 요청한다
    const [p, c] = await Promise.all([getPost(postId.value), listComments(postId.value)])
    post.value = p
    comments.value = c
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound.value = true
      return
    }
    throw err
  }
})

// 같은 라우트에서 id 만 바뀌면 컴포넌트가 재사용되므로 params.id 를 감시한다 (study4)
watch(postId, load, { immediate: true })

const isMine = computed(() => !!post.value && auth.user?.id === post.value.author.id)

function toggleFavorite() {
  if (!auth.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favorites.toggle(post.value.id)
}

function describe(err, fallback) {
  // 401 은 API 클라이언트가 로그인 화면으로 보낸다. 403 은 로그인은 되어 있으므로 안내만 한다.
  if (err instanceof ApiError && err.status === 403) return err.message
  if (err instanceof ApiError && err.status === 401) return ''
  return fallback
}

async function remove() {
  if (!confirm('이 글을 삭제할까요?')) return
  try {
    await deletePost(post.value.id)
    await router.push({ name: 'post-list' })
  } catch (err) {
    actionMessage.value = describe(err, '삭제하지 못했습니다.')
  }
}

async function addComment() {
  const body = draft.value.trim()
  if (!body) return
  commentError.value = ''
  try {
    comments.value.push(await createComment(post.value.id, body))
    post.value.commentCount += 1
    draft.value = ''
  } catch (err) {
    commentError.value = err.fields?.body?.[0] ?? describe(err, '댓글을 저장하지 못했습니다.')
  }
}

async function removeComment(c) {
  try {
    await deleteComment(c.id)
    comments.value = comments.value.filter((x) => x.id !== c.id)
    post.value.commentCount -= 1
  } catch (err) {
    commentError.value = describe(err, '삭제하지 못했습니다.')
  }
}
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'post-list' }">← 목록으로</RouterLink>

    <StateMessage :loading="loading" :error="error" @retry="load">
      <div v-if="notFound" class="state" data-testid="post-not-found">
        <p>해당 게시글을 찾을 수 없습니다.</p>
      </div>

      <article v-else-if="post">
        <header class="head">
          <div>
            <h2>{{ post.title }}</h2>
            <p class="muted">{{ post.author.nickname }} · {{ formatDate(post.createdAt) }}</p>
          </div>
          <button @click="toggleFavorite">
            {{ favorites.isFavorite(post.id) ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
          </button>
        </header>

        <!-- 사용자가 쓴 글이므로 v-html 이 아니라 {{ }} 로 출력한다 (자동 이스케이프) -->
        <p class="body">{{ post.body }}</p>

        <div v-if="isMine" class="actions">
          <RouterLink :to="{ name: 'post-edit', params: { id: post.id } }">수정</RouterLink>
          <button class="danger" @click="remove">삭제</button>
        </div>
        <p v-if="actionMessage" class="error" role="alert">{{ actionMessage }}</p>

        <h3>댓글 {{ comments.length }}</h3>
        <p v-if="comments.length === 0" class="muted">아직 댓글이 없습니다.</p>
        <ul class="comments">
          <li v-for="c in comments" :key="c.id" class="card-box">
            <p>{{ c.body }}</p>
            <p class="muted">
              {{ c.author.nickname }} · {{ formatDate(c.createdAt) }}
              <button v-if="auth.user?.id === c.author.id" @click="removeComment(c)">삭제</button>
            </p>
          </li>
        </ul>

        <form v-if="auth.isLoggedIn" @submit.prevent="addComment">
          <label class="sr-only" for="comment-body">댓글 내용</label>
          <textarea id="comment-body" v-model="draft" rows="3" maxlength="500" placeholder="댓글을 입력하세요" />
          <p v-if="commentError" class="error" role="alert">{{ commentError }}</p>
          <button class="primary" type="submit">댓글 등록</button>
        </form>
        <p v-else class="muted">댓글을 쓰려면 로그인하세요.</p>
      </article>
    </StateMessage>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}
.body {
  white-space: pre-wrap;
  line-height: 1.6;
}
.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 1rem 0;
}
.comments {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
