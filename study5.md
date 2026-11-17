# study5 — 폼·입력·검증

> 🎯 **목표**: `v-model`로 사용자 입력을 받고, 클라이언트 유효성 검사와 오류 표시를 만든 뒤, 서버가 돌려준 검증 오류도 같은 자리에 표시한다.

- 이전: [study4](./study4.md) 라우팅
- 대응 코드: [`demo/src/components/FormValidationPractice.vue`](./demo/src/components/FormValidationPractice.vue), [`LoginFormPractice.vue`](./demo/src/components/LoginFormPractice.vue), [`project/src/views/LoginView.vue`](./project/src/views/LoginView.vue)

---

## 📖 이론

### 5.1 `v-model`과 수식어

`v-model`은 입력 요소와 데이터를 양방향으로 묶습니다 (`:value` + `@input`의 줄임).

| 수식어 | 효과 |
|---|---|
| `.trim` | 앞뒤 공백 제거 |
| `.number` | 숫자로 변환 |
| `.lazy` | `input`이 아니라 `change`(포커스를 잃을 때)에 동기화 |

| 입력 요소 | 연결되는 값 |
|---|---|
| `<input type="text">`, `<textarea>` | 문자열 |
| `<input type="checkbox">` | 불리언 (여러 개면 배열) |
| `<input type="radio">` | 선택된 value |
| `<select>` | 선택된 option의 value |

### 5.2 검증의 두 층

| 층 | 어디서 | 목적 |
|---|---|---|
| 클라이언트 검증 | 브라우저(Vue) | **빠른 피드백**, UX. 우회 가능하므로 보안 수단이 아님 |
| 서버 검증 | 백엔드 | **진짜 보증.** 항상 필요 |

프론트는 두 가지를 모두 화면에 보여줄 수 있어야 합니다.

### 5.3 "언제" 오류를 보여줄 것인가

처음부터 빨간 오류가 가득하면 불친절합니다. 일반적인 패턴:

1. 처음에는 조용히 둔다.
2. 사용자가 **그 필드를 벗어났을 때(blur)** 그 필드의 오류를 보여준다 (`touched`).
3. **제출을 시도하면** 모든 필드 오류를 보여준다 (`submitted`).

---

## 🛠️ 실기

### 실습 1. 검증 로직을 `computed`로 선언 (`LoginView.vue`)

```vue
<script setup>
import { reactive, computed, ref } from 'vue'

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
</script>
```

| 줄 | 설명 |
|---|---|
| `reactive({ email, password })` | 폼은 모양이 고정된 객체라 `reactive`가 어울린다 |
| `touched` | 필드별로 "한 번 건드렸는지" 기록 |
| `errors = computed(...)` | 입력이 바뀔 때마다 **자동 재검증**. 오류가 있는 필드만 키로 가진 객체 |
| 정규식 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | 간단한 이메일 형식 검사 (엄밀한 검증은 서버 몫) |
| `isValid` | 오류 객체가 비었는지 → 제출 버튼 활성화 등에 사용 |
| `shouldShowError` | blur 했거나 제출 시도했을 때만 오류 노출 |

### 실습 2. 템플릿에서 오류 표시

```vue
<form @submit.prevent="handleSubmit" novalidate>
  <div class="field">
    <label for="login-email">이메일</label>
    <input id="login-email" v-model.trim="form.email" type="text" @blur="markTouched('email')" />
    <p v-if="shouldShowError('email')" class="error">{{ errors.email }}</p>
  </div>

  <div class="field">
    <label for="login-password">비밀번호</label>
    <input id="login-password" v-model="form.password" type="password" @blur="markTouched('password')" />
    <p v-if="shouldShowError('password')" class="error">{{ errors.password }}</p>
  </div>

  <button type="submit" :disabled="authStore.loading">
    {{ authStore.loading ? '로그인 중...' : '로그인' }}
  </button>
</form>
```

| 코드 | 설명 |
|---|---|
| `@submit.prevent` | 폼의 기본 동작(페이지 새로고침 제출)을 막고 우리 함수 실행 |
| `novalidate` | 브라우저 기본 검증 말풍선을 끄고 직접 만든 검증만 사용 |
| `label for` ↔ `input id` | 라벨 클릭 시 입력창 포커스 + 스크린리더 접근성 |
| `:disabled="authStore.loading"` | 요청 중 **중복 제출** 방지 |

### 실습 3. 제출 처리

```js
async function handleSubmit() {
  submitted.value = true          // 모든 필드의 오류를 보이게
  if (!isValid.value) return      // 오류가 있으면 요청하지 않음

  const success = await authStore.login({ email: form.email, password: form.password })
  if (success) router.push('/')
}
```

### 실습 4. 서버가 돌려준 검증 오류를 같은 자리에 표시

백엔드가 공통 API 스펙 v1의 오류 형식을 쓰면, 검증 실패 시 이렇게 옵니다.

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "입력값을 확인하세요.",
             "fields": { "email": ["이미 사용 중인 이메일입니다."] } } }
```

```js
const serverErrors = ref({})   // { email: ['...'], ... }

async function handleSubmit() {
  submitted.value = true
  serverErrors.value = {}
  if (!isValid.value) return

  try {
    await authStore.signup({ ...form })
    router.push('/login')
  } catch (err) {
    // err.fields 는 study6의 API 클라이언트가 error.fields 를 담아 던진 값
    if (err.code === 'VALIDATION_ERROR') serverErrors.value = err.fields ?? {}
  }
}

// 클라이언트 오류가 없으면 서버 오류를 대신 보여준다
function fieldError(field) {
  return (shouldShowError(field) && errors.value[field]) || serverErrors.value[field]?.[0]
}
```

```vue
<p v-if="fieldError('email')" class="error">{{ fieldError('email') }}</p>
```

- 서버 오류는 **사용자가 그 필드를 고치는 순간** 지워 주는 것이 좋다: `watch(() => form.email, () => delete serverErrors.value.email)`

### 실행 확인

```bash
cd project && npm run dev     # /login
```

1. 아무것도 입력하지 않고 로그인 버튼 → 두 필드의 오류가 모두 뜨는가
2. 이메일 칸에서 포커스를 벗어났을 때만(입력 중엔 아님) 그 필드 오류가 뜨는가
3. `abc` 입력 → "올바른 이메일 형식이 아닙니다."
4. 비밀번호 7자 → 오류, 8자 → 오류가 사라지는가
5. 요청 중 버튼이 `로그인 중...`으로 바뀌고 비활성화되는가

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 제출할 때마다 페이지가 새로고침 | `@submit.prevent`를 빼먹음 | `<form @submit.prevent="...">` |
| 한글 입력 중 글자가 한 박자 늦게 반영 | IME 조합 중에는 `v-model`이 조합 종료 후 갱신 | 정상 동작. 즉시 반응이 필요하면 `@input` 사용 |
| 입력 중인데 오류가 먼저 뜸 | `touched` 없이 바로 표시 | blur/제출 이후에만 표시 |
| 숫자 입력이 문자열로 들어옴 | `<input type="number">`도 기본은 문자열인 경우 있음 | `v-model.number` |
| 체크박스 값이 `true/false`가 아니라 배열 | `v-model` 대상이 배열인 경우 | 단일 체크박스는 불리언 ref에 연결 |
| 제출 버튼을 두 번 눌러 요청이 2번 감 | 중복 제출 방지 없음 | `loading` 동안 `:disabled`, 함수 초입에서 `if (loading.value) return` |
| `Cannot read properties of undefined (reading 'email')` | 서버 오류 객체에 해당 필드가 없음 | `serverErrors.value[field]?.[0]` 처럼 옵셔널 체이닝 |

---

## ☐ 체크리스트

- ☑ `v-model`(+ `.trim`)로 입력값 연결
- ☑ `computed`로 필드별 오류 객체와 `isValid` 작성
- ☑ `touched`/`submitted`로 오류 노출 시점 제어
- ☑ `@submit.prevent`, `novalidate`, 중복 제출 방지(`:disabled`)
- ☑ 로그인 폼(`LoginView.vue`)에 적용
- ☑ 회원가입 폼 추가 + 비밀번호 확인 일치 검사 — `project/src/views/SignupView.vue`
- ☑ 서버 `error.fields`를 필드 아래에 표시 (실습 4, study6의 API 클라이언트 필요) — `SignupView`, `PostFormView` (MSW 목 서버로 검증)
- ☑ 게시글 작성 폼(제목 1~200자, 본문 필수) 검증 — [study6](./study6.md)의 작성·수정 화면에서 사용 — `project/src/views/PostFormView.vue`

## ➡️ 다음 단계 연결

폼에서 모은 값을 **서버에 보내고 결과를 받는** 단계가 남았습니다. [study6](./study6.md)에서 API 클라이언트를 만들고 게시글 CRUD(작성·수정 화면 포함)를 완성합니다.
