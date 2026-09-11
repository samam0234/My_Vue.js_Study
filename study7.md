# study7 — Pinia로 로그인 상태 공유

체크리스트의 마지막 항목입니다. study5(폼 검증)와 study6(fetch)를 합쳐서 실제 "로그인" 흐름을 만들고, 그 결과(로그인한 사용자 정보)를 **Pinia**로 여러 컴포넌트가 공유하게 합니다.

```
- [x] Vue 3 + Vite 프로젝트 생성
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if
- [x] ref, reactive, computed, watch
- [x] 컴포넌트 props / emit
- [x] Vue Router (목록 → 상세)
- [x] 폼 검증
- [x] fetch로 API 호출
- [x] Pinia로 로그인 상태 공유                    (study7 — 이번 문서, 체크리스트 완료!)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 왜 Pinia가 필요한가 — Props Drilling 복습

study0 7.1절에서 짚었듯, 로그인 여부는 헤더(`App.vue`)와 로그인 폼(`LoginFormPractice.vue`)처럼 **부모-자식 관계가 아닌 컴포넌트들**이 동시에 알아야 하는 정보입니다. props/emit(study3)만으로는 이렇게 멀리 떨어진 컴포넌트끼리 데이터를 주고받기 번거롭습니다 — 그래서 "어디서든 접근 가능한 전역 저장소"인 Pinia를 씁니다.

## 2. 인증 스토어 — `stores/auth.js`

study1에서 프로젝트를 생성할 때 `--pinia` 옵션을 켰기 때문에 `src/stores/` 폴더와 예시 `counter.js`가 이미 있었습니다. 같은 패턴(Setup Store)으로 인증 스토어를 만듭니다.

```js
// src/stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const errorMessage = ref('')

  const isLoggedIn = computed(() => user.value !== null)

  async function login({ email, password }) {
    loading.value = true
    errorMessage.value = ''

    try {
      if (!password || password.length < 8) {
        throw new Error('비밀번호는 8자 이상이어야 합니다.')
      }

      const res = await fetch('https://jsonplaceholder.typicode.com/users')
      if (!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})`)

      const users = await res.json()
      const found = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      )

      if (!found) throw new Error('일치하는 계정을 찾을 수 없습니다.')

      user.value = found
      return true
    } catch (err) {
      errorMessage.value = err.message || '로그인에 실패했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
  }

  return { user, loading, errorMessage, isLoggedIn, login, logout }
})
```

### 이전 study들과 연결되는 지점

- `ref`, `computed` (study2): 스토어 내부는 컴포넌트 안에서 쓰던 것과 똑같은 API. **"Pinia 스토어 = 컴포넌트 바깥에서도 쓸 수 있는 반응형 상태"**라고 생각하면 이해하기 쉽습니다.
- `try/catch/finally`, `fetch`, `res.ok` (study6): `login` 액션 내부의 API 호출 로직이 study6에서 만든 `fetchUsers`와 거의 동일한 패턴입니다.
- 실제 로그인 서버가 없으므로, JSONPlaceholder의 사용자 목록을 가져와서 **입력한 이메일과 일치하는 사용자가 있는지**로 로그인 성공 여부를 흉내 냈습니다. (비밀번호는 실제로 검증하지 않고 "8자 이상"이라는 형식만 확인 — 목업이라는 점에 유의)

## 3. 로그인 폼 — study5 검증 패턴 재사용

```vue
<script setup>
import { reactive, computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
// ... study5와 동일한 touched/errors/shouldShowError 패턴 ...

async function handleSubmit() {
  submitted.value = true
  if (!isValid.value) return

  const success = await authStore.login({ email: form.email, password: form.password })
  if (success) {
    form.email = ''
    form.password = ''
  }
}
</script>
```

폼 자체의 검증 로직(이메일 형식, 비밀번호 길이)은 study5와 완전히 동일합니다. 다른 점은 "검증을 통과한 뒤 무엇을 하느냐" — 여기서는 `authStore.login(...)`을 호출해서 실제로 인증을 시도합니다.

```html
<div v-if="authStore.isLoggedIn" class="logged-in">
  <p>✅ {{ authStore.user.name }}님으로 로그인되어 있습니다.</p>
  <button @click="authStore.logout()">로그아웃</button>
</div>
<form v-else @submit.prevent="handleSubmit">
  ...
</form>
```

`authStore.isLoggedIn`(computed)에 따라 로그인 폼과 "로그인됨" 화면을 `v-if`/`v-else`로 전환합니다.

## 4. 헤더에서 같은 스토어 구독하기 — `App.vue`

```vue
<script setup>
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()
</script>

<template>
  <p class="auth-status">
    <span v-if="authStore.isLoggedIn">
      👤 {{ authStore.user.name }}님 반갑습니다
      <button @click="authStore.logout()">로그아웃</button>
    </span>
    <span v-else>로그인하지 않은 상태입니다</span>
  </p>
</template>
```

**핵심:** `LoginFormPractice.vue`와 `App.vue`는 부모-자식 관계가 아닌 서로 다른 컴포넌트지만, 둘 다 `useAuthStore()`를 호출하면 **완전히 같은 스토어 인스턴스**를 받습니다. 그래서 로그인 폼에서 로그인에 성공하는 순간, props나 emit 없이도 헤더가 즉시 갱신됩니다.

## 5. 전체 흐름 정리

```
[LoginFormPractice.vue]                [stores/auth.js]                [App.vue]
     폼 입력 + 검증(study5)                                                  │
          │                                                                  │
          ├─ handleSubmit() ──────▶ authStore.login({email, password})      │
          │                              │                                   │
          │                              ├─ fetch(...) (study6 패턴)         │
          │                              ├─ 성공 시 user.value = found       │
          │                              └─ isLoggedIn computed가 true로     │
          │                                                                  │
          ◀── 화면이 "로그인됨"으로 전환                    같은 스토어를 구독 ──▶ 헤더도 즉시 갱신
```

## 6. 실행 확인

```bash
cd demo
npm run dev
```

- 홈 화면 맨 아래 로그인 폼에서 "테스트 계정 채우기" 클릭 → 이메일/비밀번호 자동 입력
- "로그인" 클릭 → 잠깐 "로그인 중..." 상태를 거친 뒤 "OOO님으로 로그인되어 있습니다" 화면으로 전환
- **페이지 상단 헤더**를 확인 → 로그인 폼을 건드리지 않았는데도 "👤 OOO님 반갑습니다"로 바뀌어 있는지 (Pinia 공유 확인)
- 헤더 또는 로그인 폼 어느 쪽에서 "로그아웃" 클릭 → 양쪽 모두 즉시 로그아웃 상태로 바뀌는지
- 존재하지 않는 이메일이나 7자 이하 비밀번호로 로그인 시도 → 에러 메시지가 뜨는지 (`authStore.errorMessage`)

---

## 체크리스트 완료 — 다음은?

여기까지 오면 원래 체크리스트 7개 항목을 모두 실습했습니다. 다음은 **studyFinal.md**에서 지금까지 배운 모든 요소(컴포넌트, 라우팅, 반응형 상태, 폼 검증, fetch, Pinia)를 하나로 엮어 `project/` 폴더에 작은 실전 웹사이트를 만듭니다.
