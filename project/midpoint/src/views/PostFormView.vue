<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, createPost, updatePost } from '../api/posts.js'
import { ApiError } from '../api/client.js'
import { useAuthStore } from '../stores/auth.js'
import FormField from '../components/FormField.vue'
import StateMessage from '../components/StateMessage.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 작성(/posts/new)과 수정(/posts/:id/edit)이 같은 화면을 쓴다. URL 에 :id 가 있으면 수정 모드
const editId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEdit = computed(() => editId.value !== null)

const form = reactive({ title: '', body: '', tags: '' })
const touched = reactive({ title: false, body: false })
const submitted = ref(false)
const serverErrors = ref({})
const saving = ref(false)
const loading = ref(false)
const loadError = ref(null)
const message = ref('')

async function loadForEdit() {
  if (!editId.value) return
  loading.value = true
  loadError.value = null
  try {
    const post = await getPost(editId.value)
    if (post.author.id !== auth.user?.id) {
      return router.replace({ name: 'post-detail', params: { id: post.id } })
    }
    Object.assign(form, { title: post.title, body: post.body, tags: post.tags.join(', ') })
  } catch (err) {
    loadError.value = err
  } finally {
    loading.value = false
  }
}
onMounted(loadForEdit)

// study5: 클라이언트 검증은 UX 용이다. 서버가 항상 다시 검증한다.
const errors = computed(() => {
  const e = {}
  const title = form.title.trim()
  if (title.length < 1 || title.length > 200) e.title = '제목은 1~200자로 입력하세요.'
  if (!form.body.trim()) e.body = '내용을 입력하세요.'
  return e
})

function fieldError(field) {
  const client = (touched[field] || submitted.value) && errors.value[field]
  return client || serverErrors.value[field]?.[0] || ''
}

async function submit() {
  submitted.value = true
  serverErrors.value = {}
  message.value = ''
  if (Object.keys(errors.value).length || saving.value) return

  const input = {
    title: form.title.trim(),
    body: form.body.trim(),
    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
  }
  saving.value = true
  try {
    const saved = isEdit.value ? await updatePost(editId.value, input) : await createPost(input)
    await router.push({ name: 'post-detail', params: { id: saved.id } })
  } catch (err) {
    if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') serverErrors.value = err.fields ?? {}
    else if (err instanceof ApiError && err.status === 403) message.value = err.message
    else if (!(err instanceof ApiError && err.status === 401)) message.value = '저장하지 못했습니다.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="form-box">
    <h2>{{ isEdit ? '글 수정' : '글쓰기' }}</h2>
    <StateMessage :loading="loading" :error="loadError" @retry="loadForEdit">
      <form novalidate @submit.prevent="submit">
        <FormField v-model="form.title" label="제목" :error="fieldError('title')" @blur="touched.title = true" />
        <FormField v-model="form.body" label="내용" multiline :error="fieldError('body')" @blur="touched.body = true" />
        <FormField v-model="form.tags" label="태그 (쉼표로 구분)" />
        <p v-if="message" class="error" role="alert">{{ message }}</p>
        <button class="primary" type="submit" :disabled="saving">{{ saving ? '저장 중...' : '저장' }}</button>
        <button type="button" @click="router.back()">취소</button>
      </form>
    </StateMessage>
  </section>
</template>
