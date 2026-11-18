<script setup>
import { reactive, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import FormField from '../components/FormField.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitted = ref(false)

// study5: 필드별 오류를 computed 로 선언한다. 입력이 바뀔 때마다 자동으로 다시 검증된다.
const errors = computed(() => {
  const e = {}
  if (!form.email.trim()) e.email = '이메일을 입력해주세요.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = '올바른 이메일 형식이 아닙니다.'
  if (!form.password) e.password = '비밀번호를 입력해주세요.'
  else if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
  return e
})

const showError = (f) => ((touched[f] || submitted.value) && errors.value[f]) || ''

// 열린 리다이렉트를 막기 위해 같은 사이트 안의 경로만 허용한다
function safeRedirect(v) {
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/'
}

async function handleSubmit() {
  submitted.value = true
  if (Object.keys(errors.value).length || auth.loading) return
  const ok = await auth.login({ email: form.email.trim(), password: form.password })
  if (ok) await router.push(safeRedirect(route.query.redirect)) // 원래 가려던 화면으로 복귀
}

// 개발용 API 서버(server/api-server.js)의 계정 채우기
function fillTestAccount() {
  form.email = 'mina@example.com'
  form.password = 'password123'
}
</script>

<template>
  <section class="form-box card-box">
    <h2>로그인</h2>
    <p v-if="route.query.redirect" class="muted">로그인 후 이용할 수 있는 화면입니다.</p>
    <p class="muted">
      개발용 계정:
      <button type="button" @click="fillTestAccount">여기를 눌러 채우기</button>
    </p>
    <form novalidate @submit.prevent="handleSubmit">
      <FormField v-model="form.email" label="이메일" autocomplete="username" :error="showError('email')" @blur="touched.email = true" />
      <FormField
        v-model="form.password"
        label="비밀번호"
        type="password"
        autocomplete="current-password"
        :error="showError('password')"
        @blur="touched.password = true"
      />
      <button class="primary" type="submit" :disabled="auth.loading">{{ auth.loading ? '로그인 중...' : '로그인' }}</button>
      <p v-if="auth.errorMessage" class="error" role="alert">{{ auth.errorMessage }}</p>
    </form>
    <p class="muted">계정이 없나요? <RouterLink :to="{ name: 'signup' }">회원가입</RouterLink></p>
  </section>
</template>
