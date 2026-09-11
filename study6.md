# study6 — `fetch`로 API 호출

study5에서 폼 검증을 다뤘으니, 이번엔 실제로 **네트워크 너머의 데이터**를 가져오는 방법을 배웁니다. study0 6.3절에서 짚은 `fetch`/`Promise`/`async-await` 이론을 실제 공개 API로 실습합니다.

```
- [x] Vue 3 + Vite 프로젝트 생성
- [x] 템플릿 문법, v-bind / v-on / v-for / v-if
- [x] ref, reactive, computed, watch
- [x] 컴포넌트 props / emit
- [x] Vue Router (목록 → 상세)
- [x] 폼 검증
- [x] fetch로 API 호출                            (study6 — 이번 문서)
- [ ] Pinia로 로그인 상태 공유 (선택)              (study7 예정)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 사용할 API: JSONPlaceholder

[JSONPlaceholder](https://jsonplaceholder.typicode.com)는 회원가입이나 API 키 없이 바로 호출할 수 있는 테스트용 공개 REST API입니다. 실제 데이터베이스는 없고, 미리 정해진 가짜 데이터(사용자, 게시글 등)를 JSON으로 돌려줍니다. 프론트엔드 실습용으로 널리 쓰입니다.

```
GET https://jsonplaceholder.typicode.com/users?_limit=5
```

## 2. 상태 3종 세트: loading / error / success

API 호출은 시간이 걸리고 실패할 수도 있으므로, 화면은 최소 3가지 상태를 표현해야 합니다.

```js
import { ref, onMounted } from 'vue'

const users = ref([])
const loading = ref(false)
const errorMessage = ref('')

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/users?_limit=5')

    if (!res.ok) {
      throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
    }

    const data = await res.json()
    users.value = data
  } catch (err) {
    errorMessage.value = err.message || '데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
```

### 코드에서 짚어볼 부분

- **`res.ok` 직접 확인**: study0 6.3절에서 언급했듯, `fetch`는 404나 500 같은 HTTP 에러를 자동으로 `throw`하지 않습니다. 응답이 왔다는 것 자체는 성공이므로, `res.ok`(상태 코드 200~299 여부)를 직접 확인해서 필요하면 우리가 직접 `Error`를 던져야 합니다.
- **`try / catch / finally`**: 
  - `try`: API 호출 시도
  - `catch`: 네트워크 끊김, CORS 오류, 위에서 던진 `Error` 등 실패 상황을 한 곳에서 처리
  - `finally`: 성공하든 실패하든 **항상** 실행 — `loading.value = false`를 여기 두면 "로딩 끝내는 걸 깜빡하는" 실수를 방지할 수 있음
- **`onMounted(() => { fetchUsers() })`**: study2 6장에서 배운 라이프사이클 훅. 컴포넌트가 화면에 나타나는 즉시 데이터를 불러오는 가장 흔한 패턴.

## 3. 화면에서 세 상태 분기하기

study1의 `v-if`/`v-else-if`/`v-else`를 그대로 활용합니다.

```html
<div v-if="loading" class="state loading">⏳ 불러오는 중입니다...</div>

<div v-else-if="errorMessage" class="state error">
  ⚠️ {{ errorMessage }}
  <button @click="fetchUsers">다시 시도</button>
</div>

<ul v-else-if="users.length > 0">
  <li v-for="user in users" :key="user.id">
    {{ user.name }} — {{ user.email }}
  </li>
</ul>

<div v-else class="state empty">표시할 사용자가 없습니다.</div>
```

이 네 갈래 분기는 실무 API 연동 코드의 사실상 표준 패턴입니다: **로딩 중 / 에러 / 데이터 있음 / 데이터 없음(빈 배열)**.

## 4. 재시도(retry) 버튼

에러가 나도 사용자가 다시 시도할 수 있어야 합니다. `fetchUsers` 함수를 다시 호출하기만 하면 되므로, 버튼에 같은 함수를 연결합니다.

```html
<button @click="fetchUsers" :disabled="loading">
  {{ loading ? '불러오는 중...' : '다시 불러오기' }}
</button>
```

`:disabled="loading"`: 이미 로딩 중일 때 버튼을 눌러 중복 요청이 나가는 걸 막습니다 (`v-bind`, study0 2.3절).

## 5. `async/await` vs `.then()` 체인 비교

study0 6.3절에서 본 두 문법을 다시 비교하면:

```js
// .then() 체인 방식
function fetchUsersThen() {
  loading.value = true
  fetch('https://jsonplaceholder.typicode.com/users?_limit=5')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then((data) => {
      users.value = data
    })
    .catch((err) => {
      errorMessage.value = err.message
    })
    .finally(() => {
      loading.value = false
    })
}

// async/await 방식 (이번 실습에서 사용한 방식)
async function fetchUsers() {
  loading.value = true
  try {
    const res = await fetch(...)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    users.value = await res.json()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}
```

두 코드는 동작이 완전히 같습니다. `async/await`가 일반적인 동기 코드처럼 위에서 아래로 읽히기 때문에 가독성이 좋아 최근에는 이쪽을 더 많이 씁니다.

## 6. 실행 확인

```bash
cd demo
npm run dev
```

- 페이지 로드 직후 "불러오는 중..." 문구가 잠깐 보였다가 사용자 5명 목록으로 바뀌는지 (`onMounted` 확인)
- "다시 불러오기" 클릭 → 다시 로딩 상태를 거쳐 목록이 갱신되는지
- 네트워크가 끊긴 상태(브라우저 개발자도구 Network 탭에서 "Offline" 체크)에서 "다시 불러오기" 클릭 → 에러 메시지와 "다시 시도" 버튼이 보이는지
- 네트워크를 다시 연결하고 "다시 시도" 클릭 → 정상적으로 목록이 뜨는지

---

## 다음 단계 (study7 예정)

- study5의 회원가입/로그인 폼 검증 + 이번 문서의 fetch 패턴을 합쳐서, 실제로 "로그인 성공 → 사용자 정보 저장" 흐름을 만들기
- Pinia로 로그인한 사용자 정보를 여러 컴포넌트(헤더 등)에서 공유하기
