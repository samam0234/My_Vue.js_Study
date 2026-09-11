<script setup>
import { ref, computed, reactive } from 'vue'

const form = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
})

// 사용자가 한 번이라도 이 필드를 "떠났는지"(blur) 기록.
// 처음부터 에러를 보여주면 사용자 경험이 나쁘므로, 건드린 필드만 에러를 표시합니다.
const touched = reactive({
  username: false,
  email: false,
  password: false,
  passwordConfirm: false,
})

const submitted = ref(false)
const submitResult = ref('')

// 필드별 검증 규칙을 computed로 선언 — form이 바뀔 때마다 자동으로 재계산됨
const errors = computed(() => {
  const e = {}

  if (!form.username.trim()) {
    e.username = '아이디를 입력해주세요.'
  } else if (form.username.trim().length < 3) {
    e.username = '아이디는 3자 이상이어야 합니다.'
  }

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

  if (!form.passwordConfirm) {
    e.passwordConfirm = '비밀번호를 한 번 더 입력해주세요.'
  } else if (form.password !== form.passwordConfirm) {
    e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
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

function handleSubmit() {
  submitted.value = true // 제출 시도하면 모든 에러를 한꺼번에 노출

  if (!isValid.value) {
    submitResult.value = ''
    return
  }

  // 실제로는 여기서 fetch로 서버에 전송합니다 (study6, study7에서 다룰 내용).
  submitResult.value = `"${form.username}"님, 가입 정보가 유효합니다! (아직 서버 전송은 안 함)`
}

function resetForm() {
  form.username = ''
  form.email = ''
  form.password = ''
  form.passwordConfirm = ''
  Object.keys(touched).forEach((key) => (touched[key] = false))
  submitted.value = false
  submitResult.value = ''
}
</script>

<template>
  <section class="practice">
    <h2>폼 검증 실습: 회원가입 폼</h2>
    <p class="desc">
      각 입력칸을 벗어날 때(blur)마다 검증하고, "가입하기"를 누르면 전체 필드를 한 번에 검증합니다.
    </p>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="field">
        <label for="username">아이디</label>
        <input
          id="username"
          v-model.trim="form.username"
          type="text"
          @blur="markTouched('username')"
        />
        <p v-if="shouldShowError('username')" class="error">{{ errors.username }}</p>
      </div>

      <div class="field">
        <label for="email">이메일</label>
        <input
          id="email"
          v-model.trim="form.email"
          type="text"
          @blur="markTouched('email')"
        />
        <p v-if="shouldShowError('email')" class="error">{{ errors.email }}</p>
      </div>

      <div class="field">
        <label for="password">비밀번호</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          @blur="markTouched('password')"
        />
        <p v-if="shouldShowError('password')" class="error">{{ errors.password }}</p>
      </div>

      <div class="field">
        <label for="passwordConfirm">비밀번호 확인</label>
        <input
          id="passwordConfirm"
          v-model="form.passwordConfirm"
          type="password"
          @blur="markTouched('passwordConfirm')"
        />
        <p v-if="shouldShowError('passwordConfirm')" class="error">{{ errors.passwordConfirm }}</p>
      </div>

      <div class="actions">
        <button type="submit" :disabled="submitted && !isValid">가입하기</button>
        <button type="button" @click="resetForm">초기화</button>
      </div>
    </form>

    <p v-if="submitResult" class="success">{{ submitResult }}</p>
    <p v-else-if="submitted && !isValid" class="error">
      입력값을 다시 확인해주세요. (위 빨간 글씨 항목)
    </p>
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

.success {
  color: #2e7d32;
  font-weight: 600;
  margin-top: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
