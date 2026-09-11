<script setup>
import { reactive, computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitted = ref(false)

// study5와 같은 패턴: computed로 검증 에러를 선언
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

  // study6에서 배운 fetch + loading/error 패턴이 authStore.login 내부에 그대로 들어있음
  const success = await authStore.login({ email: form.email, password: form.password })
  if (success) {
    form.email = ''
    form.password = ''
    submitted.value = false
    touched.email = false
    touched.password = false
  }
}

function fillTestAccount() {
  form.email = 'Sincere@april.biz'
  form.password = 'test1234'
}
</script>

<template>
  <section class="practice">
    <h2>Pinia로 로그인 상태 공유</h2>
    <p class="desc">
      로그인 폼(study5의 검증 패턴) + fetch(study6의 API 호출)를 합쳐서, 성공하면
      Pinia 스토어(<code>useAuthStore</code>)에 사용자 정보를 저장합니다. 페이지 상단
      헤더가 이 스토어를 구독해서 로그인 상태를 즉시 반영합니다.
    </p>

    <div v-if="authStore.isLoggedIn" class="logged-in">
      <p>✅ <strong>{{ authStore.user.name }}</strong>님으로 로그인되어 있습니다.</p>
      <p class="email">{{ authStore.user.email }}</p>
      <button @click="authStore.logout()">로그아웃</button>
    </div>

    <form v-else @submit.prevent="handleSubmit" novalidate>
      <p class="hint">
        테스트 계정이 없다면 버튼을 눌러 자동으로 채워보세요 (JSONPlaceholder 목업 사용자).
        <button type="button" class="link-btn" @click="fillTestAccount">테스트 계정 채우기</button>
      </p>

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
.practice {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.desc {
  font-size: 0.9rem;
  color: #666;
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
  max-width: 320px;
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

.logged-in {
  background: rgba(46, 125, 50, 0.08);
  border-radius: 4px;
  padding: 1rem;
}

.logged-in .email {
  color: #666;
  font-size: 0.9rem;
}
</style>
