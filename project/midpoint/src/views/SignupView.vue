<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { signup } from '../api/auth.js'
import { ApiError } from '../api/client.js'
import FormField from '../components/FormField.vue'

const router = useRouter()

const form = reactive({ email: '', nickname: '', password: '', passwordConfirm: '' })
const touched = reactive({ email: false, nickname: false, password: false, passwordConfirm: false })
const submitted = ref(false)
const saving = ref(false)
const serverErrors = ref({})
const message = ref('')

const errors = computed(() => {
  const e = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = '올바른 이메일 형식이 아닙니다.'
  const nickname = form.nickname.trim()
  if (nickname.length < 2 || nickname.length > 20) e.nickname = '닉네임은 2~20자로 입력하세요.'
  if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
  if (form.passwordConfirm !== form.password) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  return e
})

function fieldError(f) {
  return ((touched[f] || submitted.value) && errors.value[f]) || serverErrors.value[f]?.[0] || ''
}

// 사용자가 해당 필드를 고치는 순간 서버 오류를 지운다
for (const f of ['email', 'nickname', 'password']) {
  watch(() => form[f], () => delete serverErrors.value[f])
}

async function submit() {
  submitted.value = true
  serverErrors.value = {}
  message.value = ''
  if (Object.keys(errors.value).length || saving.value) return
  saving.value = true
  try {
    await signup({ email: form.email.trim(), nickname: form.nickname.trim(), password: form.password })
    await router.push({ name: 'login' })
  } catch (err) {
    if (err instanceof ApiError && ['VALIDATION_ERROR', 'EMAIL_TAKEN'].includes(err.code)) serverErrors.value = err.fields ?? {}
    else message.value = '회원가입에 실패했습니다.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="form-box card-box">
    <h2>회원가입</h2>
    <form novalidate @submit.prevent="submit">
      <FormField v-model="form.email" label="이메일" autocomplete="username" :error="fieldError('email')" @blur="touched.email = true" />
      <FormField v-model="form.nickname" label="닉네임" :error="fieldError('nickname')" @blur="touched.nickname = true" />
      <FormField v-model="form.password" label="비밀번호" type="password" autocomplete="new-password" :error="fieldError('password')" @blur="touched.password = true" />
      <FormField v-model="form.passwordConfirm" label="비밀번호 확인" type="password" autocomplete="new-password" :error="fieldError('passwordConfirm')" @blur="touched.passwordConfirm = true" />
      <p v-if="message" class="error" role="alert">{{ message }}</p>
      <button class="primary" type="submit" :disabled="saving">{{ saving ? '가입 중...' : '가입하기' }}</button>
    </form>
    <p class="muted">이미 계정이 있나요? <RouterLink :to="{ name: 'login' }">로그인</RouterLink></p>
  </section>
</template>
