<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitted = ref(false)

const errors = computed(() => {
  const e = {}
  if (!form.email.trim()) {
    e.email = '이메일을 입력해주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (!form.password) {
    e.password = '비밀번호를 입력해주세요.'
  } else if (form.password.length < 8) {
    e.password = '비밀번호는 8자 이상이어야 합니다.'
  }
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

function markTouched(field) {
  touched[field] = true
}

function shouldShowError(field) {
  return (touched[field] || submitted.value) && errors.value[field]
}

async function handleSubmit() {
  submitted.value = true
  if (!isValid.value) return

  const success = await authStore.login({ email: form.email, password: form.password })
  if (success) {
    router.push('/') // 로그인 성공 시 홈으로 이동
  }
}

function fillTestAccount() {
  form.email = 'Sincere@april.biz'
  form.password = 'test1234'
}
</script>

<template>
  <section class="login-view">
    <h2>로그인</h2>

    <p class="hint">
      테스트 계정이 없다면
      <button type="button" class="link-btn" @click="fillTestAccount">여기를 눌러 채우기</button>
    </p>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="field">
        <label for="login-email">이메일</label>
        <input
          id="login-email"
          v-model.trim="form.email"
          type="text"
          @blur="markTouched('email')"
        />
        <p v-if="shouldShowError('email')" class="error">{{ errors.email }}</p>
      </div>

      <div class="field">
        <label for="login-password">비밀번호</label>
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          @blur="markTouched('password')"
        />
        <p v-if="shouldShowError('password')" class="error">{{ errors.password }}</p>
      </div>

      <button type="submit" :disabled="authStore.loading">
        {{ authStore.loading ? '로그인 중...' : '로그인' }}
      </button>

      <p v-if="authStore.errorMessage" class="error server-error">
        {{ authStore.errorMessage }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.login-view {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
}

.hint {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1rem;
}

.link-btn {
  border: none;
  background: none;
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.field input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}

.error {
  color: #d9534f;
  font-size: 0.85rem;
  margin: 0.25rem 0 0;
}

.server-error {
  margin-top: 0.75rem;
}
</style>
