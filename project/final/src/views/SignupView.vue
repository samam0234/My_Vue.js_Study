<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { signup } from '@/api/auth'
import { ApiError } from '@/api/client'
import FormField from '@/components/FormField.vue'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()

const form = reactive({ email: '', nickname: '', password: '', passwordConfirm: '' })
const touched = reactive({ email: false, nickname: false, password: false, passwordConfirm: false })
const submitted = ref(false)
const saving = ref(false)
const serverErrors = ref<Record<string, string[]>>({})
const message = ref('')

type Field = keyof typeof form

const errors = computed(() => {
  const e: Partial<Record<Field, string>> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    e.email = '올바른 이메일 형식이 아닙니다.'
  const nickname = form.nickname.trim()
  if (nickname.length < 2 || nickname.length > 20) e.nickname = '닉네임은 2~20자로 입력하세요.'
  if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
  if (form.passwordConfirm !== form.password) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  return e
})
const isValid = computed(() => Object.keys(errors.value).length === 0)

function fieldError(field: Field) {
  const client = (touched[field] || submitted.value) && errors.value[field]
  return client || serverErrors.value[field]?.[0] || ''
}

// 사용자가 해당 필드를 고치는 순간 서버 오류를 지운다.
for (const field of ['email', 'nickname', 'password'] as const) {
  watch(
    () => form[field],
    () => delete serverErrors.value[field],
  )
}

async function submit() {
  submitted.value = true
  serverErrors.value = {}
  message.value = ''
  if (!isValid.value || saving.value) return

  saving.value = true
  try {
    await signup({
      email: form.email.trim(),
      nickname: form.nickname.trim(),
      password: form.password,
    })
    await router.push({ name: 'login' })
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.code === 'VALIDATION_ERROR' || err.code === 'EMAIL_TAKEN')
    ) {
      serverErrors.value = err.fields ?? {}
    } else {
      message.value = '회원가입에 실패했습니다. 잠시 후 다시 시도하세요.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm rounded-lg bg-white p-6 ring-1 ring-slate-200">
    <h2 class="mb-4 text-xl font-bold">회원가입</h2>

    <form novalidate @submit.prevent="submit">
      <FormField
        v-model="form.email"
        label="이메일"
        autocomplete="username"
        :error="fieldError('email')"
        @blur="touched.email = true"
      />
      <FormField
        v-model="form.nickname"
        label="닉네임"
        autocomplete="nickname"
        :error="fieldError('nickname')"
        @blur="touched.nickname = true"
      />
      <FormField
        v-model="form.password"
        label="비밀번호"
        type="password"
        autocomplete="new-password"
        :error="fieldError('password')"
        @blur="touched.password = true"
      />
      <FormField
        v-model="form.passwordConfirm"
        label="비밀번호 확인"
        type="password"
        autocomplete="new-password"
        :error="fieldError('passwordConfirm')"
        @blur="touched.passwordConfirm = true"
      />

      <p v-if="message" role="alert" class="mb-3 text-sm text-red-600">{{ message }}</p>
      <AppButton type="submit" :loading="saving">{{
        saving ? '가입 중...' : '가입하기'
      }}</AppButton>
    </form>

    <p class="mt-4 text-sm text-slate-500">
      이미 계정이 있나요? <RouterLink :to="{ name: 'login' }">로그인</RouterLink>
    </p>
  </section>
</template>
