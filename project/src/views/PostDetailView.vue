<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getPost, deletePost } from '@/api/posts'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { useAsync } from '@/composables/useAsync'
import { formatDate, fromNow } from '@/utils/format'
import StateMessage from '@/components/StateMessage.vue'
import CommentSection from '@/components/CommentSection.vue'
import AiSummary from '@/components/AiSummary.vue'
import AppButton from '@/components/AppButton.vue'
import type { Post } from '@/types/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()

const post = ref<Post | null>(null)
const notFound = ref(false)
const actionMessage = ref('')

const postId = computed(() => String(route.params.id))

const {
  loading,
  error,
  run: load,
} = useAsync(async () => {
  notFound.value = false
  post.value = null
  try {
    post.value = await getPost(postId.value)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound.value = true
      return
    }
    throw err
  }
})

// 같은 라우트에서 id 만 바뀌면 컴포넌트가 재사용되므로 params.id 를 감시한다 (study4).
watch(postId, load, { immediate: true })

const isMine = computed(() => !!post.value && auth.user?.id === post.value.author.id)

function toggleFavorite() {
  if (!post.value) return
  if (!auth.isLoggedIn) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  favorites.toggle(post.value.id)
}

async function remove() {
  if (!post.value || !confirm('이 글을 삭제할까요?')) return
  actionMessage.value = ''
  try {
    await deletePost(post.value.id)
    await router.push({ name: 'post-list' })
  } catch (err) {
    // 401 은 API 클라이언트가 로그인 화면으로 보낸다. 403 은 로그인은 되어 있으므로 안내만 한다.
    if (err instanceof ApiError && err.status === 403) actionMessage.value = err.message
    else if (!(err instanceof ApiError && err.status === 401)) {
      actionMessage.value = '삭제하지 못했습니다. 잠시 후 다시 시도하세요.'
    }
  }
}

function onCountChange(delta: number) {
  if (post.value) post.value.commentCount += delta
}
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'post-list' }" class="text-sm">← 목록으로</RouterLink>

    <StateMessage :loading="loading" :error="error" @retry="load">
      <div v-if="notFound" class="py-12 text-center text-slate-500" data-testid="post-not-found">
        <p>해당 게시글을 찾을 수 없습니다.</p>
        <RouterLink :to="{ name: 'post-list' }">목록으로 돌아가기</RouterLink>
      </div>

      <article v-else-if="post" class="mt-4">
        <header class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">{{ post.title }}</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ post.author.nickname }} ·
              <time :datetime="post.createdAt" :title="formatDate(post.createdAt)">{{
                fromNow(post.createdAt)
              }}</time>
            </p>
          </div>
          <button
            type="button"
            class="whitespace-nowrap text-sm"
            :class="favorites.isFavorite(post.id) ? 'text-amber-600' : 'text-slate-500'"
            @click="toggleFavorite"
          >
            {{ favorites.isFavorite(post.id) ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
          </button>
        </header>

        <!-- 사용자가 쓴 글이므로 v-html 이 아니라 {{ }} 로 출력한다 (자동 이스케이프, study16) -->
        <p class="whitespace-pre-wrap leading-relaxed">{{ post.body }}</p>

        <ul v-if="post.tags.length" class="mt-4 flex gap-2">
          <li
            v-for="tag in post.tags"
            :key="tag"
            class="rounded-full bg-slate-200 px-2 py-0.5 text-xs"
          >
            #{{ tag }}
          </li>
        </ul>

        <div v-if="isMine" class="mt-6 flex gap-2">
          <RouterLink :to="{ name: 'post-edit', params: { id: post.id } }">
            <AppButton variant="secondary">수정</AppButton>
          </RouterLink>
          <AppButton variant="danger" @click="remove">삭제</AppButton>
        </div>
        <p v-if="actionMessage" role="alert" class="mt-2 text-sm text-red-600">
          {{ actionMessage }}
        </p>

        <AiSummary :text="post.body" />
        <CommentSection :post-id="post.id" @count-change="onCountChange" />
      </article>
    </StateMessage>
  </section>
</template>
