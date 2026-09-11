# study2 — 반응형 상태: `ref`, `reactive`, `computed`, `watch`

study1에서 템플릿 문법으로 화면을 그리는 방법을 배웠습니다.
이제 **데이터가 바뀌면 화면이 자동으로 갱신된다**는 Vue의 핵심 개념인 **반응형(Reactivity)**을 깊게 파고듭니다.

study0 3장에서 개념만 짚고 넘어간 `ref`, `reactive`, `computed`, `watch`를 직접 손으로 만지며 차이를 느낀 뒤, 언제 뭘 쓸지 판단하는 기준을 익힙니다.

```
- [ ] Vue 3 + Vite 프로젝트 생성                  (study1 완료)
- [ ] 템플릿 문법, v-bind / v-on / v-for / v-if  (study1 완료)
- [x] ref, reactive, computed, watch             (study2 — 이번 문서)
- [ ] 컴포넌트 props / emit
- [ ] Vue Router (목록 → 상세)
- [ ] 폼 검증 + fetch로 API 호출
- [ ] Pinia로 로그인 상태 공유 (선택)
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 핵심 개념 재확인: 반응형(Reactivity)이란

> 데이터가 바뀌면, 그 데이터를 사용하는 화면이 **자동으로** 다시 그려진다.

바닐라 JS 코드라면:
```js
let count = 0
const btn = document.querySelector('button')
btn.addEventListener('click', () => {
  count++
  document.querySelector('p').textContent = count  // 직접 DOM 갱신해야 함
})
```

Vue에서는:
```js
const count = ref(0)
// 템플릿에서 {{ count }}를 쓰면, count.value가 바뀔 때마다 자동으로 화면이 갱신됨
```

Vue가 이 마법을 가능하게 하기 위해 `ref`, `reactive` 같은 API를 제공합니다.

---

## 2. `ref` — 단일 값을 감싸서 반응형으로 만들기

### 2.1 기초 사용법

```js
import { ref } from 'vue'

const count = ref(0)
const message = ref('안녕하세요')
const user = ref({ name: '홍길동', age: 20 })
```

### 2.2 `.value`로 JS 코드에서 접근/수정

**스크립트 안에서는 `.value` 필수:**

```js
console.log(count.value)    // 0
count.value++               // 1로 변경
count.value = 10            // 10으로 변경
```

**왜 `.value`가 필요한가?**

JavaScript의 원시값(number, string 등)은 참조로 추적할 방법이 없습니다. Vue는 `{ value: 0 }` 같은 객체로 감싸고, getter/setter를 통해 변화를 감지합니다.

### 2.3 템플릿 안에서는 `.value` 불필요 (자동 언랩)

**템플릿에서는 `.value` 생략:**

```vue
<template>
  <p>{{ count }}</p>     <!-- count.value를 자동으로 풀어서 보여줌 -->
  <button @click="count++">+1</button>  <!-- count.value++ 로 자동 해석 -->
</template>
```

### 2.4 배열도 ref로 감쌀 수 있음

```js
const fruits = ref(['사과', '바나나'])
fruits.value.push('포도')   // 배열 메서드 사용 가능
```

---

## 3. `reactive` — 객체 전체를 반응형으로 만들기

### 3.1 기초 사용법

```js
import { reactive } from 'vue'

const user = reactive({ name: '홍길동', age: 20 })
const settings = reactive({ darkMode: false, fontSize: 14 })
```

### 3.2 `.value` 없이 직접 접근/수정

```js
console.log(user.name)     // '홍길동' (.value 없음!)
user.age++                 // 21로 변경
```

### 3.3 `ref` vs `reactive` 차이점

| 항목 | `ref` | `reactive` |
|---|---|---|
| 원시값(숫자, 문자열) | ✅ 가능 | ❌ 불가 (객체 전용) |
| 객체/배열 | ✅ 가능 | ✅ 가능 |
| 스크립트에서 접근 | `.value` 필수 | `.value` 불필요 |
| 템플릿에서 접근 | `.value` 불필요 (자동 언랩) | 바로 접근 |
| 구조분해 후 반응성 | ❌ 끊김 | ❌ 끊김 (toRefs로 해결) |

### 3.4 구조분해(destructuring) 문제

**reactive는 구조분해하면 반응성이 끊깁니다:**

```js
const user = reactive({ name: '홍길동', age: 20 })
const { name, age } = user    // ⚠️ 반응성 끊김!

name = '김철수'  // 화면에 갱신 안 됨
```

**ref는 구조분해해도 반응성이 유지됩니다 (`.value`를 통해):**

```js
const count = ref(0)
const { value: count2 } = count   // ref 객체의 value 프로퍼티를 가져옴
count.value++                      // count2도 함께 갱신됨
```

이 문제 때문에 **실무에서는 `ref`를 기본으로 쓰는 경향**이 있습니다.

---

## 4. `computed` — 다른 반응형 데이터로부터 파생값 만들기

### 4.1 기초 사용법

의존하는 데이터가 바뀔 때만 재계산되고, 안 바뀌면 이전 결과를 재사용(캐싱)합니다.

```js
import { ref, computed } from 'vue'

const price = ref(1000)
const quantity = ref(3)

const total = computed(() => {
  console.log('계산 중!')
  return price.value * quantity.value
})

console.log(total.value)     // '계산 중!' 출력, 3000 반환
console.log(total.value)     // '계산 중!' 출력 안 함 (캐시된 값 반환)
price.value = 2000
console.log(total.value)     // '계산 중!' 출력, 6000 반환
```

### 4.2 함수와의 차이

**함수 방식 (매번 재계산):**

```js
function getTotal() {
  return price.value * quantity.value
}
console.log(getTotal())   // 호출할 때마다 계산
```

**computed 방식 (의존성이 바뀔 때만 재계산):**

```js
const total = computed(() => price.value * quantity.value)
console.log(total.value)  // 의존성이 바뀔 때만 재계산
```

데이터 변경이 빈번하지 않으면 큰 차이 없지만, 렌더링이 자주 일어나는 화면에서는 computed가 훨씬 효율적입니다.

### 4.3 쓰기 가능한 computed (심화)

기본은 읽기 전용이지만, getter/setter를 모두 정의할 수 있습니다.

```js
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newValue) {
    [firstName.value, lastName.value] = newValue.split(' ')
  }
})

console.log(fullName.value)      // '홍 길동'
fullName.value = '김 철수'       // setter 실행, firstName과 lastName 각각 갱신
```

---

## 5. `watch` — 반응형 데이터 변화를 감시해서 부수효과 실행

### 5.1 기초 사용법

```js
import { ref, watch } from 'vue'

const keyword = ref('')

watch(keyword, (newValue, oldValue) => {
  console.log(`검색어: ${oldValue} → ${newValue}`)
  // 여기서 API 호출, localStorage 저장 등 "부수효과" 실행
})
```

데이터가 바뀔 때마다 콜백 함수가 실행됩니다.

### 5.2 여러 소스 감시하기

```js
const firstName = ref('홍')
const lastName = ref('길동')

// 배열로 여러 ref를 감시
watch([firstName, lastName], (newValues, oldValues) => {
  const [newFirst, newLast] = newValues
  const [oldFirst, oldLast] = oldValues
  console.log(`${oldFirst} ${oldLast} → ${newFirst} ${newLast}`)
})
```

### 5.3 즉시 실행 (immediate 옵션)

기본적으로 `watch`는 처음 설정할 때는 실행되지 않고, 이후 변경될 때만 실행됩니다.
`immediate: true` 옵션을 주면 설정 직후 한 번 즉시 실행됩니다.

```js
watch(
  keyword,
  (newValue) => {
    console.log('검색:', newValue)
  },
  { immediate: true }  // 설정 직후 한 번 즉시 실행
)
```

### 5.4 깊은 감시 (deep 옵션)

객체나 배열의 **중첩된 프로퍼티** 변경도 감시하려면 `deep: true`를 줍니다.

```js
const user = reactive({ name: '홍길동', age: 20 })

watch(
  user,
  (newUser) => {
    console.log('user 변경:', newUser)
  },
  { deep: true }  // 중첩된 프로퍼티 변경도 감시
)

user.age = 21   // 감시됨
```

**주의:** 깊은 감시는 성능 비용이 크므로, 가능하면 감시할 프로퍼티를 구체적으로 지정하세요.

```js
// 더 효율적: age만 감시
watch(() => user.age, (newAge) => { ... })
```

### 5.5 `watchEffect` — 자동 의존성 추적

콜백 함수 안에서 사용하는 반응형 변수들을 자동으로 감시합니다.

```js
import { ref, watchEffect } from 'vue'

const count = ref(0)
const multiplier = ref(2)

watchEffect(() => {
  // count와 multiplier를 사용하므로 둘 다 자동으로 감시
  console.log(`${count.value} × ${multiplier.value} = ${count.value * multiplier.value}`)
})

count.value++           // 감시됨
multiplier.value = 3    // 감시됨
```

`watch`보다 간단하지만, 의존성을 명시하지 않아서 혹시 모르는 것들까지 감시할 수 있다는 단점이 있습니다.

---

## 6. 라이프사이클 훅 — 컴포넌트 특정 시점에 코드 실행하기

### 6.1 주요 라이프사이클

```
생성(setup) → 마운트(onMounted) → 갱신(onUpdated) → 언마운트(onUnmounted)
```

### 6.2 `onMounted` — 컴포넌트가 DOM에 붙은 직후

가장 자주 쓰는 훅입니다. API 데이터 로드, 이벤트 리스너 등록 등을 여기서 합니다.

```js
import { onMounted } from 'vue'

onMounted(() => {
  console.log('컴포넌트가 DOM에 붙었습니다')
  // API 호출
  fetch('/api/data').then(res => res.json()).then(data => {
    // 데이터 처리
  })
})
```

### 6.3 기타 훅

```js
import { onMounted, onUpdated, onUnmounted } from 'vue'

onMounted(() => {
  console.log('마운트됨')
})

onUpdated(() => {
  console.log('데이터 갱신됨')
})

onUnmounted(() => {
  console.log('언마운트됨 (정리 작업: 이벤트 리스너 제거 등)')
})
```

---

## 7. 실습 컴포넌트들

study1의 `TemplateSyntaxPractice.vue`에서 `ref`를 이미 쓰고 있었으니, 이제 다음 컴포넌트들을 추가합니다:

### 7.1 `RefReactivePractice.vue` — ref vs reactive 직접 비교

### 7.2 `ComputedPractice.vue` — computed의 캐싱 확인

### 7.3 `WatchPractice.vue` — watch와 watchEffect 실습

### 7.4 `LifecyclePractice.vue` — onMounted로 데이터 초기화

---

## 8. 실행 확인

```bash
cd demo
npm run dev
```

홈 페이지에서 다음 섹션들이 모두 나타나는지 확인:
- 템플릿 문법 실습 (study1)
- ref vs reactive 비교 (study2)
- computed 캐싱 (study2)
- watch 감시 (study2)
- 라이프사이클 (study2)

---

## 9. 선택 가이드: 언제 뭘 쓸까?

| 상황 | 추천 | 이유 |
|---|---|---|
| 숫자, 문자열, 불리언 하나 | `ref` | 구조분해 후에도 반응성 유지 |
| 여러 필드의 객체를 하나의 단위로 다룸 | `ref` 또는 `reactive` | 둘 다 가능, 구조분해 계획 없으면 reactive 편함 |
| 구조분해할 계획 있음 | `ref` | reactive는 구조분해하면 반응성 끊김 |
| 다른 반응형 데이터로부터 파생값 만듦 | `computed` | 성능 최적화(캐싱) |
| 데이터 변화에 따라 무언가 실행하고 싶음 | `watch` | 부수효과(API 호출, 저장 등) 실행 |
| 명확한 콜백 로직 없이 자동 추적 | `watchEffect` | watch보다 간단 |
| 컴포넌트 초기화 시점에 코드 실행 | `onMounted` | API 로드, 이벤트 리스너 등록 |

---

## 다음 단계 (study3 예정)

- 컴포넌트 쪼개기: 자식 컴포넌트에 데이터 내려주고(`props`), 자식이 부모에게 알리기(`emit`)
- 버튼 컴포넌트, 입력 컴포넌트 등 재사용 가능한 조각으로 분리
