<script setup lang="ts">
import { ref, watch } from 'vue'
import { listComments, createComment, deleteComment } from '@/api/comments'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useAsync } from '@/composables/useAsync'
import { fromNow } from '@/utils/format'
import type { Comment } from '@/types/api'
import StateMessage from './StateMessage.vue'
import AppButton from './AppButton.vue'

const props = defineProps<{ postId: number | string }>()
const emit = defineEmits<{ (e: 'count-change', delta: number): void }>()

const auth = useAuthStore()
const comments = ref<Comment[]>([])
const {
  loading,
  error,
  run: load,
} = useAsync(async () => {
  comments.value = await listComments(props.postId)
})

watch(() => props.postId, load, { immediate: true })

const draft = ref('')
const submitting = ref(false)
const formError = ref('')

// study11: 낙관적 업데이트 — 서버 응답 전에 화면에 먼저 넣고, 실패하면 되돌린다.
async function submit() {
  const body = draft.value.trim()
  if (!body || !auth.user) return

  const tempId = -Date.now()
  const optimistic: Comment = {
    id: tempId,
    postId: Number(props.postId),
    body,
    author: { id: auth.user.id, nickname: auth.user.nickname },
    createdAt: new Date().toISOString(),
  }
  comments.value = [...comments.value, optimistic]
  draft.value = ''
  formError.value = ''
  submitting.value = true
  emit('count-change', 1)

  try {
    const saved = await createComment(props.postId, body)
    comments.value = comments.value.map((c) => (c.id === tempId ? saved : c))
  } catch (err) {
    comments.value = comments.value.filter((c) => c.id !== tempId) // 롤백
    draft.value = body
    emit('count-change', -1)
    formError.value =
      err instanceof ApiError && err.fields?.body?.[0]
        ? err.fields.body[0]
        : '댓글을 저장하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}

async function remove(comment: Comment) {
  const before = comments.value
  comments.value = before.filter((c) => c.id !== comment.id)
  emit('count-change', -1)
  try {
    await deleteComment(comment.id)
  } catch (err) {
    comments.value = before // 롤백
    emit('count-change', 1)
    formError.value =
      err instanceof ApiError && err.status === 403 ? err.message : '삭제하지 못했습니다.'
  }
}
</script>

<template>
  <section class="mt-8" aria-labelledby="comments-title">
    <h3 id="comments-title" class="mb-3 text-lg font-semibold">댓글 {{ comments.length }}</h3>

    <StateMessage
      :loading="loading"
      :error="error"
      :empty="comments.length === 0"
      empty-text="아직 댓글이 없습니다."
      @retry="load"
    >
      <ul class="space-y-3">
        <li v-for="c in comments" :key="c.id" class="rounded-md bg-white p-3 ring-1 ring-slate-200">
          <p class="whitespace-pre-wrap text-sm">{{ c.body }}</p>
          <p class="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>{{ c.author.nickname }} · {{ fromNow(c.createdAt) }}</span>
            <button
              v-if="auth.user?.id === c.author.id && c.id > 0"
              type="button"
              class="text-red-500 hover:underline"
              @click="remove(c)"
            >
              삭제
            </button>
          </p>
        </li>
      </ul>
    </StateMessage>

    <form v-if="auth.isLoggedIn" class="mt-4" @submit.prevent="submit">
      <label for="comment-body" class="sr-only">댓글 내용</label>
      <textarea
        id="comment-body"
        v-model="draft"
        rows="3"
        maxlength="500"
        placeholder="댓글을 입력하세요"
        class="w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
      />
      <p v-if="formError" role="alert" class="mt-1 text-sm text-red-600">{{ formError }}</p>
      <AppButton type="submit" :loading="submitting" class="mt-2">댓글 등록</AppButton>
    </form>
    <p v-else class="mt-4 text-sm text-slate-500">댓글을 쓰려면 로그인하세요.</p>
  </section>
</template>
