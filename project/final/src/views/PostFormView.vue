<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, createPost, updatePost } from '@/api/posts'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import FormField from '@/components/FormField.vue'
import AppButton from '@/components/AppButton.vue'
import StateMessage from '@/components/StateMessage.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 작성(/posts/new)과 수정(/posts/:id/edit)이 같은 화면을 쓴다. URL 에 :id 가 있으면 수정 모드.
const editId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEdit = computed(() => editId.value !== null)

const form = reactive({ title: '', body: '', tags: '' })
const touched = reactive({ title: false, body: false })
const submitted = ref(false)
const serverErrors = ref<Record<string, string[]>>({})
const saving = ref(false)
const loading = ref(false)
const loadError = ref<Error | null>(null)
const message = ref('')

async function loadForEdit() {
  if (!editId.value) return
  loading.value = true
  loadError.value = null
  try {
    const post = await getPost(editId.value)
    if (post.author.id !== auth.user?.id) {
      message.value = '본인이 쓴 글만 수정할 수 있습니다.'
      return router.replace({ name: 'post-detail', params: { id: post.id } })
    }
    Object.assign(form, { title: post.title, body: post.body, tags: post.tags.join(', ') })
  } catch (err) {
    loadError.value = err instanceof Error ? err : new Error(String(err))
  } finally {
    loading.value = false
  }
}
onMounted(loadForEdit)

// study5: 클라이언트 검증은 UX 용이다. 서버가 항상 다시 검증한다.
const errors = computed(() => {
  const e: Record<string, string> = {}
  const title = form.title.trim()
  if (title.length < 1 || title.length > 200) e.title = '제목은 1~200자로 입력하세요.'
  if (!form.body.trim()) e.body = '내용을 입력하세요.'
  return e
})
const isValid = computed(() => Object.keys(errors.value).length === 0)

function fieldError(field: 'title' | 'body') {
  const client = (touched[field] || submitted.value) && errors.value[field]
  return client || serverErrors.value[field]?.[0] || ''
}

async function submit() {
  submitted.value = true
  serverErrors.value = {}
  message.value = ''
  if (!isValid.value || saving.value) return

  const input = {
    title: form.title.trim(),
    body: form.body.trim(),
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  }

  saving.value = true
  try {
    const saved = isEdit.value ? await updatePost(editId.value!, input) : await createPost(input)
    await router.push({ name: 'post-detail', params: { id: saved.id } })
  } catch (err) {
    if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
      serverErrors.value = err.fields ?? {}
    } else if (err instanceof ApiError && err.status === 403) {
      message.value = err.message
    } else if (!(err instanceof ApiError && err.status === 401)) {
      message.value = '저장하지 못했습니다. 잠시 후 다시 시도하세요.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <h2 class="mb-4 text-xl font-bold">{{ isEdit ? '글 수정' : '글쓰기' }}</h2>

    <StateMessage :loading="loading" :error="loadError" @retry="loadForEdit">
      <form novalidate @submit.prevent="submit">
        <FormField
          v-model="form.title"
          label="제목"
          :error="fieldError('title')"
          @blur="touched.title = true"
        />
        <FormField
          v-model="form.body"
          label="내용"
          multiline
          :error="fieldError('body')"
          @blur="touched.body = true"
        />
        <FormField v-model="form.tags" label="태그 (쉼표로 구분)" placeholder="vue, study" />

        <p v-if="message" role="alert" class="mb-3 text-sm text-red-600">{{ message }}</p>

        <div class="flex gap-2">
          <AppButton type="submit" :loading="saving">{{
            saving ? '저장 중...' : '저장'
          }}</AppButton>
          <AppButton variant="secondary" @click="router.back()">취소</AppButton>
        </div>
      </form>
    </StateMessage>
  </section>
</template>
