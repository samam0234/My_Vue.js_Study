# study0 — 환경 설정

> 🎯 **목표**: Node.js와 Vue 3 + Vite 프로젝트를 만들고, `npm run dev`로 첫 화면이 뜨는 것까지 확인하며 핵심 용어를 익힌다.

- 위치: 기초 구간 (study0~10)
- 대응 코드: [`demo/`](./demo) (개별 실습 연습장), [`project/`](./project) (종합 미니 게시판)
- 이 문서는 다른 프레임워크와 비교하지 않고 **Vue 하나만** 다룹니다.

---

## 📖 이론

### 0.1 SPA (Single Page Application)

일반 웹사이트(MPA)는 페이지 이동마다 서버에서 새 HTML을 받습니다. SPA는 **처음 한 번만 HTML을 받고**, 이후에는 자바스크립트가 화면을 바꿔치기합니다.

- 장점: 페이지 전환이 빠르고 앱처럼 부드럽다.
- 단점: 첫 로딩이 상대적으로 무겁고, 검색엔진 최적화(SEO)에 별도 대응이 필요하다.
- Vue는 SPA를 만들기 위한 **프레임워크**다. 화면(View)을 데이터(State)에 따라 자동 갱신하는 규칙을 Vue가 정하고, 우리는 데이터와 템플릿을 작성한다.

### 0.2 반응형(Reactivity) — Vue를 관통하는 한 문장

> 데이터가 바뀌면, 그 데이터를 쓰는 화면이 **자동으로** 다시 그려진다.

```js
// 바닐라 JS: DOM을 직접 갱신해야 한다
let count = 0
button.addEventListener('click', () => {
  count++
  document.querySelector('p').textContent = count
})
```

```js
// Vue: 데이터만 바꾸면 화면은 Vue가 갱신한다
const count = ref(0)
count.value++
```

### 0.3 Node.js · npm · Vite

| 용어 | 한 줄 설명 |
|---|---|
| Node.js | 브라우저 밖에서 자바스크립트를 실행하는 환경. Vite 같은 개발 도구가 이 위에서 돈다 |
| npm | 패키지(라이브러리) 설치·관리 도구. Node.js와 함께 설치된다 |
| `package.json` | 의존 패키지, 실행 스크립트(`npm run dev` 등), 요구 Node 버전을 적은 설정 파일 |
| `node_modules/` | 설치된 패키지가 저장되는 폴더. 용량이 커서 git에 올리지 않는다(`.gitignore`) |
| Vite | 개발 서버 + 번들러. 개발 중에는 브라우저의 네이티브 ES 모듈을 이용해 필요한 파일만 변환하므로 서버가 매우 빨리 뜬다 |
| HMR | Hot Module Replacement. 파일을 저장하면 새로고침 없이 바뀐 부분만 반영된다 |
| SFC | Single File Component. `*.vue` 파일 하나에 `<script>`/`<template>`/`<style>`을 모은 형식 |

### 0.4 이 저장소가 쓰는 버전 (package.json 기준)

| 패키지 | 버전 |
|---|---|
| vue | ^3.5.40 |
| vue-router | ^5.2.0 |
| pinia | ^4.0.2 |
| vite | ^8.1.5 |
| @vitejs/plugin-vue | ^6.0.8 |
| Node.js | ^22.18.0 또는 >=24.12.0 (`engines`) |

---

## 🛠️ 실기

### 1. 설치 확인

```bash
node -v    # v22.18 이상 (이 저장소 작업 환경: v24.14.0)
npm -v     # 11.x
```

### 2. 프로젝트 생성

```bash
npm create vue@latest demo -- --router --pinia
cd demo
npm install
npm run dev
```

| 줄 | 설명 |
|---|---|
| `npm create vue@latest demo` | Vue 공식 스캐폴딩 도구로 `demo/` 폴더에 프로젝트를 만든다 |
| `-- --router --pinia` | 앞의 `--`는 "이후 옵션은 create-vue에 전달"이라는 뜻. Router와 Pinia를 미리 설치·연결한다 |
| `npm install` | `package.json`에 적힌 의존성을 `node_modules/`에 설치 |
| `npm run dev` | `package.json`의 `scripts.dev`(= `vite`)를 실행해 개발 서버를 켠다 |

터미널에 표시되는 주소(기본 `http://localhost:5173`)로 접속하면 Vue 환영 화면이 보입니다.

### 3. 생성된 폴더 구조

```
demo/
├─ index.html           # 진입 HTML. <div id="app"> 하나와 main.js 로드
├─ vite.config.js       # Vite 설정 (플러그인, '@' 별칭)
├─ package.json
├─ jsconfig.json
├─ public/              # 가공 없이 그대로 서빙되는 정적 파일 (favicon 등)
└─ src/
   ├─ main.js           # 앱 생성 + 플러그인 등록 + 마운트
   ├─ App.vue           # 최상위 컴포넌트
   ├─ assets/           # CSS, 이미지
   ├─ components/       # 재사용 컴포넌트
   ├─ views/            # 라우트 하나에 대응하는 화면
   ├─ router/index.js  # URL ↔ 화면 매핑
   └─ stores/           # Pinia 스토어
```

### 4. 진입점 `src/main.js` 줄별 설명

```js
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

| 줄 | 설명 |
|---|---|
| `import './assets/main.css'` | 전역 스타일 적용 |
| `createApp(App)` | `App.vue`를 루트로 하는 Vue 앱 인스턴스 생성 |
| `app.use(createPinia())` | 플러그인 등록. 이후 모든 컴포넌트에서 `useXxxStore()` 사용 가능 |
| `app.use(router)` | 라우터 등록. `<RouterView>`, `<RouterLink>`, `useRoute()`가 동작하게 됨 |
| `app.mount('#app')` | `index.html`의 `<div id="app">`에 앱을 그린다 |

### 5. SFC 구조

```vue
<script setup>
import { ref } from 'vue'
const message = ref('안녕')
</script>

<template>
  <p>{{ message }}</p>
</template>

<style scoped>
p { color: #3b82f6; }
</style>
```

- `<script setup>`: 컴포넌트의 로직. 여기서 선언한 변수·함수는 템플릿에서 바로 쓸 수 있다.
- `<template>`: 화면 구조.
- `<style scoped>`: 이 컴포넌트 안에서만 적용되는 스타일.

### 6. 이 저장소의 두 프로젝트

| 폴더 | 역할 |
|---|---|
| `demo/` | 개념을 한 페이지에 계속 쌓는 **연습장** (Todo, 템플릿, ref/reactive, props/emit, Router, 폼, fetch, Pinia 로그인) |
| `project/` | 연습장에서 익힌 것을 합쳐 만든 **미니 게시판** (JSONPlaceholder 사용) |

### 7. 실행 확인 절차

1. `npm run dev` 후 브라우저에서 `http://localhost:5173` 접속
2. 환영 화면이 보이는지 확인
3. `src/App.vue`의 텍스트를 하나 바꾸고 **저장만** 했을 때 새로고침 없이 화면이 바뀌는지(HMR) 확인
4. 개발자도구(F12) → Console에 빨간 오류가 없는지 확인

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `Unsupported engine` 경고 / Vite 실행 실패 | Node 버전이 `engines` 요구보다 낮음 | Node 22.18+ 또는 24.12+로 올린다 (`nvm`, 공식 설치 파일) |
| PowerShell에서 `npm.ps1 ... 스크립트를 실행할 수 없습니다` | Windows 실행 정책이 스크립트를 막음 | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 또는 `npm.cmd` 사용 |
| `Port 5173 is in use` | 이전 dev 서버가 살아 있음 | 이전 터미널 종료, 또는 `npm run dev -- --port 5174` |
| `Cannot find module ...` | `npm install`을 안 했거나 `node_modules` 손상 | `node_modules`와 `package-lock.json`을 지우지 말고 먼저 `npm install` 재실행. 그래도 안 되면 `node_modules`만 삭제 후 `npm ci` |
| 빈 하얀 화면 | `main.js` 임포트 오타, 템플릿 오류 | 브라우저 Console의 첫 번째 오류 줄을 확인 |

---

## ☐ 체크리스트

- ☑ `node -v`, `npm -v`로 버전 확인
- ☑ `npm create vue@latest`로 Vue 3 + Vite 프로젝트 생성 (`--router --pinia`)
- ☑ `npm run dev` 실행, 브라우저에서 첫 화면 확인
- ☑ `main.js`가 하는 일(`createApp` → `use` → `mount`)을 설명할 수 있다
- ☑ SFC의 세 블록(`script setup` / `template` / `style scoped`)을 구분할 수 있다
- ☑ `demo/`(연습장)와 `project/`(종합)의 역할 차이를 설명할 수 있다
- ☐ HMR이 동작하는 것을 직접 확인 (App.vue 수정 → 새로고침 없이 반영)

## ➡️ 다음 단계 연결

[study1](./study1.md)에서 `App.vue`에 첫 화면(Hello World)을 직접 그리고, `v-bind` / `v-on` / `v-for` / `v-if` 같은 기본 템플릿 문법을 익힙니다.
