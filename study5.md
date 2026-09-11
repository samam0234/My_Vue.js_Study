# study5 — 폼 검증

원래 체크리스트의 "폼 검증 + fetch로 API 호출" 항목을, 각각 깊이 있게 다루기 위해 두 문서로 나눴습니다. 이번 문서는 **폼 검증**만 다루고, 실제 서버 통신(fetch)은 study6에서 이어집니다.

```
- [x] Vue 3 + Vite 프로젝트 생성
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if
- [x] ref, reactive, computed, watch
- [x] 컴포넌트 props / emit
- [x] Vue Router (목록 → 상세)
- [x] 폼 검증                                     (study5 — 이번 문서)
- [ ] fetch로 API 호출                            (study6 예정)
- [ ] Pinia로 로그인 상태 공유 (선택)              (study7 예정)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. `v-model` 다시 보기

study0 2.7절에서 짧게 언급했던 `v-model`을 이번엔 제대로 씁니다.

```html
<input v-model="form.username" type="text" />
```

`v-model`은 사실 아래 두 가지를 합쳐놓은 축약형입니다:

```html
<!-- v-model과 동일한 의미 -->
<input :value="form.username" @input="form.username = $event.target.value" />
```

- `:value`(study0 2.3절 `v-bind`)로 현재 값을 화면에 보여주고
- `@input`(study0 2.4절 `v-on`)으로 사용자가 입력할 때마다 데이터를 갱신

양방향 바인딩이라고 부르는 이유: 데이터가 바뀌면 화면이 바뀌고(`:value`), 화면(입력)이 바뀌면 데이터도 바뀝니다(`@input`).

### 1.1 v-model 수식어(modifier)

```html
<input v-model.trim="form.username" />     <!-- 앞뒤 공백 자동 제거 -->
<input v-model.number="age" type="number" /> <!-- 문자열 대신 숫자로 변환 -->
<input v-model.lazy="keyword" />           <!-- input 대신 change 이벤트에 반응(포커스 아웃 시) -->
```

이번 실습에서는 아이디/이메일에 `.trim`을 사용해 공백만 입력하고 제출하는 걸 방지했습니다.

## 2. 검증 로직을 `computed`로 선언하기

study2에서 배운 `computed`를 폼 검증에 활용하는 게 이번 실습의 핵심입니다. "에러 객체"를 `computed`로 선언하면, 폼 데이터가 바뀔 때마다 **자동으로** 최신 에러 상태가 유지됩니다.

```js
const form = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
})

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
```

`form`은 여러 필드를 가진 객체라서 study2 3장에서 다룬 기준대로 `reactive`를 썼습니다. (구조분해할 계획이 없으므로 `reactive`가 자연스러움)

## 3. "언제" 에러를 보여줄 것인가 — UX 패턴

검증 로직만큼 중요한 게 **"에러를 언제 화면에 보여주는가"**입니다. 무작정 항상 보여주면, 사용자가 아이디 칸을 클릭만 해도 "아이디를 입력해주세요"가 바로 뜨는 불편한 경험이 됩니다.

이번 실습에서 쓴 패턴:

```js
const touched = reactive({
  username: false,
  email: false,
  password: false,
  passwordConfirm: false,
})

const submitted = ref(false)

function markTouched(field) {
  touched[field] = true
}

function shouldShowError(field) {
  return (touched[field] || submitted.value) && errors.value[field]
}
```

```html
<input v-model.trim="form.username" @blur="markTouched('username')" />
<p v-if="shouldShowError('username')" class="error">{{ errors.username }}</p>
```

- `@blur`(포커스가 그 입력칸을 벗어날 때 발생하는 이벤트): 사용자가 그 필드를 "한 번 만졌다"는 걸 기록
- `touched[field]`가 true이거나, 폼을 이미 제출 시도했으면(`submitted`) 에러를 노출
- 즉, **처음 진입해서 아무것도 안 건드렸을 땐 에러가 안 보이고**, 필드를 벗어나거나 제출을 시도한 뒤부터 에러가 보임

## 4. 제출 처리

```js
function handleSubmit() {
  submitted.value = true // 제출 시도하면 모든 필드 에러를 한꺼번에 노출

  if (!isValid.value) {
    submitResult.value = ''
    return
  }

  // 실제로는 여기서 fetch로 서버에 전송 (study6, study7에서 이어짐)
  submitResult.value = `"${form.username}"님, 가입 정보가 유효합니다! (아직 서버 전송은 안 함)`
}
```

```html
<form @submit.prevent="handleSubmit" novalidate>
```

- `@submit.prevent`: `v-on`의 이벤트 수식어. `.prevent`는 `event.preventDefault()`를 자동으로 호출 — 브라우저의 기본 폼 제출(페이지 새로고침)을 막고, 대신 Vue가 관리하는 `handleSubmit`만 실행되게 함.
- `novalidate`: HTML 기본 검증 팝업(브라우저 내장 "이 필드를 작성하세요" 툴팁)을 끄고, 우리가 만든 검증 UI만 쓰도록 함.
- 지금은 실제 서버로 데이터를 보내지 않고 성공 메시지만 표시합니다. **study6에서 fetch를 배운 뒤, study7에서 이 폼을 실제 로그인 폼으로 발전시켜 Pinia와 연결**할 예정입니다.

## 5. 실행 확인

```bash
cd demo
npm run dev
```

- 아이디 칸을 클릭했다가 빈 채로 벗어나기 → "아이디를 입력해주세요" 에러가 뜨는지 (`@blur` 확인)
- 2자만 입력 → "3자 이상이어야 합니다" 에러 확인
- 이메일에 `abc` 입력 → 형식 에러 확인, `abc@test.com` 입력 → 에러 사라지는지
- 비밀번호와 비밀번호 확인을 다르게 입력 → 불일치 에러 확인
- 모든 필드를 비운 채 "가입하기" 클릭 → 한 번에 모든 에러가 노출되는지 (`submitted` 확인)
- 모든 값을 올바르게 입력 후 제출 → 성공 메시지가 뜨는지
- "초기화" 클릭 → 폼과 에러 상태가 모두 리셋되는지

---

## 다음 단계 (study6 예정)

- 실제 `fetch`로 공개 API(JSONPlaceholder 등)를 호출해서 데이터를 가져오기
- 로딩 상태, 에러 상태, 성공 상태를 반응형으로 관리하는 패턴 익히기
