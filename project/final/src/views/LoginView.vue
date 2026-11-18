<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FormField from '@/components/FormField.vue'
import AppButton from '@/components/AppButton.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitted = ref(false)

// study5: 필드별 오류를 computed 로 선언한다. 입력이 바뀔 때마다 자동으로 다시 검증된다.
const errors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.email.trim()) e.email = '이메일을 입력해주세요.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    e.email = '올바른 이메일 형식이 아닙니다.'
  if (!form.password) e.password = '비밀번호를 입력해주세요.'
  else if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
  return e
})
const isValid = computed(() => Object.keys(errors.value).length === 0)

const showError = (field: 'email' | 'password') =>
  (touched[field] || submitted.value) && errors.value[field] ? errors.value[field] : ''

// 열린 리다이렉트를 막기 위해 같은 사이트 안의 경로만 허용한다.
function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

async function handleSubmit() {
  submitted.value = true
  if (!isValid.value || auth.loading) return
  const ok = await auth.login({ email: form.email.trim(), password: form.password })
  if (ok) await router.push(safeRedirect(route.query.redirect)) // 원래 가려던 화면으로 복귀
}

// 개발용 목 서버 계정 채우기. 운영 빌드에서는 값이 'false' 로 치환되어 이 코드(와 계정 문자열)가 번들에서 사라진다.
const showTestAccount = import.meta.env.VITE_ENABLE_MOCK === 'true'

function fillTestAccount() {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'true') return
  form.email = 'mina@example.com'
  form.password = 'password123'
}
</script>

<template>
  <section class="mx-auto max-w-sm rounded-lg bg-white p-6 ring-1 ring-slate-200">
    <h2 class="mb-2 text-xl font-bold">로그인</h2>
    <p v-if="route.query.redirect" class="mb-3 text-sm text-slate-500">
      로그인 후 이용할 수 있는 화면입니다.
    </p>

    <p v-if="showTestAccount" class="mb-4 text-xs text-slate-500">
      개발용 목 서버 계정:
      <button type="button" class="text-blue-600 underline" @click="fillTestAccount">
        여기를 눌러 채우기
      </button>
    </p>

    <form novalidate @submit.prevent="handleSubmit">
      <FormField
        v-model="form.email"
        label="이메일"
        autocomplete="username"
        :error="showError('email')"
        @blur="touched.email = true"
      />
      <FormField
        v-model="form.password"
        label="비밀번호"
        type="password"
        autocomplete="current-password"
        :error="showError('password')"
        @blur="touched.password = true"
      />

      <AppButton type="submit" :loading="auth.loading">{{
        auth.loading ? '로그인 중...' : '로그인'
      }}</AppButton>

      <p v-if="auth.errorMessage" role="alert" class="mt-3 text-sm text-red-600">
        {{ auth.errorMessage }}
      </p>
    </form>

    <p class="mt-4 text-sm text-slate-500">
      계정이 없나요? <RouterLink :to="{ name: 'signup' }">회원가입</RouterLink>
    </p>
  </section>
</template>
