# study17 — Docker·배포 자동화

> 🎯 **목표**: Vue 앱을 멀티 스테이지 Dockerfile로 **Nginx 이미지**로 묶고, GitHub Actions가 이미지를 빌드·푸시한 뒤 외부 서비스에 **자동 배포**하는 과정을 만든다.

- 이전: [study16](./study16.md) 보안·운영 (보안 헤더, SPA fallback을 Nginx 설정에 담는다)
- 이 문서의 코드는 **저장소에 아직 반영하지 않은 실습 예시**입니다. 배포 대상 서비스는 선택이며, 실제 배포 전에는 계정·비밀 값 설정을 직접 확인하세요.

---

## 📖 이론

### 17.1 Vue 앱을 Docker로 묶는다는 것

Vue SPA의 결과물은 정적 파일(`dist/`)이므로 컨테이너에는 **Node가 필요 없고, Nginx 같은 정적 서버만 있으면** 됩니다. 그래서 **멀티 스테이지 빌드**를 씁니다.

```
[1단계: build]  node 이미지 ── npm ci ── npm run build ──▶ dist/
                                                           │ (복사)
[2단계: runtime] nginx 이미지 ◀─────────────────────────────┘
                 최종 이미지에는 dist/ + nginx 설정만 (수십 MB, node_modules 없음)
```

장점: 작은 이미지, 빠른 배포, 공격 면적 감소, "내 컴퓨터에서는 됐는데" 제거.

### 17.2 핵심 용어

| 용어 | 설명 |
|---|---|
| 이미지(Image) | 실행 환경을 묶은 읽기 전용 패키지 |
| 컨테이너(Container) | 이미지를 실행한 프로세스 |
| `Dockerfile` | 이미지를 만드는 레시피 |
| `.dockerignore` | 빌드 컨텍스트에서 제외할 파일 (`node_modules`, `.git`, `.env.local`) |
| 레지스트리 | 이미지 저장소 (Docker Hub, GHCR 등) |
| docker compose | 여러 컨테이너(프론트+백엔드+DB)를 한 파일로 정의·실행 |

### 17.3 환경변수는 "빌드 시점" 문제

`VITE_API_BASE_URL`은 번들에 **빌드할 때 박힙니다** ([study8](./study8.md), [study10](./study10.md)). 컨테이너를 실행할 때 `-e`로 넣어도 이미 빌드된 JS는 안 바뀝니다. 해법은 둘 중 하나입니다.

| 방법 | 설명 | 선택 기준 |
|---|---|---|
| **빌드 인자**(`--build-arg`) | 환경마다 이미지를 따로 빌드 | 단순. 환경 수가 적을 때 |
| **런타임 설정 파일** | 이미지는 하나, 시작 시 `/config.js`를 생성해 `window.__CONFIG__`로 주입 | "하나의 이미지로 여러 환경" 요구 시 |

또는 같은 도메인에서 Nginx가 `/api`를 백엔드로 프록시하면 프론트는 **상대 경로 `/api`만** 쓰므로 변수가 필요 없습니다(CORS도 사라짐).

### 17.4 배포 자동화(CD) 흐름

```
git push (master) ─▶ GitHub Actions
                        ├─ CI: lint · type-check · test · build   (study15)
                        ├─ docker build ─▶ 레지스트리(GHCR)에 push (태그: git sha)
                        └─ 배포 대상에 새 이미지(또는 dist)를 반영
                              ├─ 컨테이너 호스팅 서비스(이미지 지정)
                              └─ 정적 호스팅(Vercel/Netlify에 dist 업로드)
```

---

## 🛠️ 실기

### 실습 1. `Dockerfile` (멀티 스테이지)

```dockerfile
# project/Dockerfile

# ---------- 1단계: 빌드 ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=""
ARG VITE_APP_TITLE="Mini Board"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_TITLE=$VITE_APP_TITLE

RUN npm run build

# ---------- 2단계: 실행 ----------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
```

| 줄 | 설명 |
|---|---|
| `FROM node:22-alpine AS build` | 빌드 전용 단계. `package.json`의 `engines`(^22.18) 이상인 22 계열을 사용하고, 필요하면 정확한 마이너 태그로 고정 |
| `COPY package*.json` → `npm ci` → `COPY . .` | **의존성 설치를 먼저** 해서, 소스만 바뀌면 설치 단계가 **레이어 캐시**를 재사용 → 빌드 빨라짐 |
| `ARG` + `ENV` | 빌드 시 `--build-arg`로 받은 값을 Vite가 읽도록 환경변수로 노출 |
| `RUN npm run build` | `dist/` 생성 (`build`에 `type-check`를 넣었다면 타입 오류 시 이미지 빌드도 실패) |
| `FROM nginx:... AS runtime` | 최종 이미지는 Nginx만 — `node_modules`가 들어가지 않는다 |
| `COPY --from=build` | 1단계의 `dist`만 가져온다 |
| `HEALTHCHECK` | 컨테이너가 "살아 있고 응답하는지" 오케스트레이터가 확인 (`/healthz`는 아래 설정) |

### 실습 2. `nginx.conf` — SPA fallback + 캐시 + 보안 헤더 + (선택) API 프록시

```nginx
# project/nginx.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  location = /healthz {
    access_log off;
    return 200 "ok\n";
  }

  # 해시 파일명 자산: 장기 캐시
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  # 선택: 같은 도메인에서 백엔드로 프록시 (프론트는 /api 상대 경로 사용)
  # location /api/ {
  #   proxy_pass http://backend:8000;
  #   proxy_set_header Host $host;
  #   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  # }

  # SPA fallback: 파일이 없으면 index.html (Vue Router가 URL을 처리)
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ /index.html;
  }
}
```

> `add_header`는 `location` 안에서 다시 `add_header`를 쓰면 **상위 서버 레벨의 헤더가 상속되지 않습니다.** 보안 헤더를 모든 위치에 적용하려면 location마다 반복하거나 `include`로 공통 파일을 쓰세요. (오류 노트 참고)

### 실습 3. `.dockerignore`

```
node_modules
dist
.git
.github
.env.local
.env.*.local
coverage
playwright-report
*.log
```

`node_modules`를 컨텍스트에 안 보내 빌드가 빨라지고, `.env.local` 같은 비밀이 이미지에 들어가는 사고를 막습니다.

### 실습 4. 로컬 빌드·실행

```bash
cd project
docker build -t mini-board-web:local --build-arg VITE_API_BASE_URL=https://api.example.com .
docker run --rm -p 8080:80 mini-board-web:local
# http://localhost:8080  — /posts/1 직접 접속·새로고침이 되는지 확인
```

```bash
docker image ls mini-board-web           # 이미지 크기 확인 (node 이미지보다 훨씬 작다)
docker run --rm mini-board-web:local nginx -t   # 설정 문법 검사
curl -I http://localhost:8080/           # 보안 헤더 확인
```

### 실습 5. docker compose — 프론트 + 백엔드 함께

```yaml
# docker-compose.yml (저장소 루트 또는 project/)
services:
  web:
    build:
      context: ./project
      args:
        VITE_API_BASE_URL: ""            # 같은 도메인의 /api 사용 (nginx 프록시)
    ports:
      - "8080:80"
    depends_on:
      - backend

  backend:
    image: your-backend-image:latest     # 공통 API 스펙 v1을 구현한 서버 이미지
    environment:
      CORS_ORIGIN: http://localhost:8080
      DATABASE_URL: ${DATABASE_URL}      # .env 파일(커밋 금지)에서 주입
    expose:
      - "8000"
```

```bash
docker compose up --build
```

`nginx.conf`의 `/api/` 프록시 주석을 풀면 `web` 컨테이너가 `http://backend:8000`(컨테이너 이름이 DNS)으로 전달합니다. 브라우저 입장에서는 같은 출처라 CORS가 필요 없습니다.

### 실습 6. GitHub Actions — 이미지 빌드 → GHCR push

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [master]
  workflow_dispatch:                     # 수동 실행 버튼

permissions:
  contents: read
  packages: write                        # GHCR에 push 하려면 필요

env:
  IMAGE: ghcr.io/${{ github.repository_owner }}/mini-board-web

jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: project } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: project/package-lock.json }
      - run: npm ci
      - run: npm run ci                  # study15: lint · type-check · test · build

  image:
    needs: test                          # 테스트 통과 후에만
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      - uses: docker/build-push-action@v6
        with:
          context: ./project
          push: true
          tags: |
            ${{ env.IMAGE }}:${{ github.sha }}
            ${{ env.IMAGE }}:latest
          build-args: |
            VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

| 줄 | 설명 |
|---|---|
| `workflow_dispatch` | 필요할 때 수동 실행 |
| `permissions.packages: write` | 기본 `GITHUB_TOKEN`으로 GHCR push 허용 |
| `needs: test` | 검사 → 이미지 순서 보장. 실패하면 배포 안 함 |
| 태그 `:${{ github.sha }}` | 커밋 해시 태그 — **어떤 커밋이 배포됐는지 추적**, 롤백 시 해당 태그로 되돌림. `latest`만 쓰면 되돌리기가 어렵다 |
| `build-args` ← `vars.VITE_API_BASE_URL` | 저장소 Variables(공개 가능한 값)로 주입. **비밀 값은 `secrets`**, 단 프론트로 가는 값은 어차피 공개이므로 비밀을 넣지 않는다 |
| `cache-from/to: type=gha` | 빌드 레이어를 Actions 캐시에 저장 |

### 실습 7. 외부 서비스에 배포 — 두 가지 경로

**경로 A. 컨테이너 호스팅(이미지 기반)**: Render, Fly.io, Railway, AWS/GCP 컨테이너 서비스 등에서 "레지스트리의 이미지(`ghcr.io/.../mini-board-web:<sha>`)로 서비스 생성" → 새 푸시 때마다 **배포 훅(Deploy Hook URL)** 을 호출해 재배포합니다.

```yaml
  deploy:
    needs: image
    runs-on: ubuntu-latest
    steps:
      - name: 배포 훅 호출
        run: curl -fsS -X POST "${{ secrets.DEPLOY_HOOK_URL }}"      # URL 자체가 비밀 → secrets 사용
```

**경로 B. 정적 호스팅(Docker 없이 `dist`)**: Vercel/Netlify에 Git을 연결하면 push마다 자동 빌드·배포됩니다. 또는 Actions에서 CLI로 업로드합니다.

```yaml
  deploy-static:
    needs: test
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: project } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: project/package-lock.json }
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
      - run: npx netlify-cli deploy --dir=dist --prod        # 또는 vercel deploy --prebuilt --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

| 비교 | A. 컨테이너 | B. 정적 호스팅 |
|---|---|---|
| 프론트 운영 부담 | 이미지·서버 관리 | 거의 없음 (CDN) |
| Nginx 설정 자유도 | 높음 (프록시·헤더) | 서비스 설정 파일에 의존 |
| 백엔드와 한 묶음 배포 | 쉬움 (compose) | 따로 |
| 적합 | 백엔드와 같은 인프라에서 운영, 하나의 이미지 표준화 | 프론트만 빠르게 |

### 실습 8. 배포 후 점검 (Smoke Test)

```bash
curl -fsS https://도메인/healthz
curl -I https://도메인/                   # 보안 헤더, 200
curl -I https://도메인/posts/1            # SPA fallback: 200 이어야 함 (404면 설정 오류)
```

Actions의 마지막 단계에 위 `curl`을 넣어 **배포가 살아 있는지 자동 확인**하고, 실패하면 이전 `sha` 태그로 롤백합니다.

### 실행 확인

1. `docker build`가 성공하고 최종 이미지 크기가 수십 MB 수준인가
2. `docker run`으로 띄운 `http://localhost:8080/posts/1`을 새로고침해도 열리는가 (SPA fallback)
3. 소스 한 줄만 바꿔 다시 빌드할 때 `npm ci` 단계가 **CACHED**로 표시되는가
4. Actions에서 `test → image → deploy` 순서로 초록불, 레지스트리에 `:sha` 태그 이미지가 생겼는가
5. 일부러 테스트를 깨뜨리면 이미지·배포 단계가 **실행되지 않는가**
6. 배포 URL에서 로그인·목록·작성이 동작하고 CORS 오류가 없는가

---

## ⚠️ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 컨테이너에서 `/posts/1` 새로고침 404 | `try_files ... /index.html` 누락 | `nginx.conf`의 `location /` 확인 |
| 컨테이너 실행 후 API가 개발용 주소로 감 | `VITE_*`가 빌드 시 안 들어감 | `--build-arg`/`ARG`+`ENV` 확인, 런타임 `-e`는 무효 |
| `npm ci` 실패: lock 불일치 | `package-lock.json` 미동기화 | 로컬에서 `npm install` 후 lock 커밋 |
| 빌드는 되는데 `Cannot find module` (리눅스 이미지에서만) | 파일명 대소문자 불일치 (Windows는 무시) | 실제 파일명과 import 대소문자 일치 |
| 이미지가 너무 큼 | `node` 이미지를 최종 단계로 사용 / `node_modules` 포함 | 멀티 스테이지, `.dockerignore` |
| 소스만 바꿨는데 의존성이 매번 재설치 | `COPY . .`를 `npm ci`보다 먼저 둠 | `package*.json`만 먼저 복사 |
| 보안 헤더가 일부 응답에만 보임 | `location` 안의 `add_header`가 상위 설정을 덮어씀 | location마다 반복하거나 `include snippets/headers.conf` |
| GHCR push `denied` | `packages: write` 권한 없음 / 패키지 접근 설정 | workflow `permissions`, 패키지 설정에서 저장소 연결 |
| Actions에서 `secrets`가 비어 있음 | 포크 PR에는 비밀이 전달되지 않음 / 이름 오타 | 저장소 Settings → Secrets 확인, 포크 PR 정책 이해 |
| 배포했는데 이전 화면이 계속 보임 | `index.html`이 캐시됨 | `index.html`은 `no-cache` |
| 컨테이너가 `unhealthy` | `/healthz` 미구현·`wget` 없음 | nginx 설정과 이미지(alpine은 busybox `wget` 포함) 확인 |
| 비밀 값이 이미지 레이어에 남음 | `ARG`/`ENV`에 비밀을 넣음 (레이어에 기록됨) | 프론트 빌드에는 **비밀을 넣지 않는다**. 비밀은 런타임/서버 쪽에서만 |

---

## ☐ 체크리스트

- ☐ 멀티 스테이지 `Dockerfile` + `nginx.conf` + `.dockerignore` 작성
- ☐ `docker build` / `docker run`으로 로컬 확인, SPA fallback·보안 헤더 확인
- ☐ 레이어 캐시(의존성 먼저 복사)로 재빌드 속도 개선 확인
- ☐ `VITE_*`가 "빌드 시점" 값이라는 것과 해결 방법 2가지를 설명
- ☐ compose로 프론트 + 백엔드를 함께 실행 (또는 Nginx `/api` 프록시 설계)
- ☐ GitHub Actions: `test → image(GHCR, sha 태그) → deploy`
- ☐ 컨테이너/정적 호스팅 중 한 곳에 실제 자동 배포
- ☐ 배포 후 smoke test(`/healthz`, `/posts/1`)와 롤백 방법(이전 sha 태그) 정리
- ☐ 비밀은 `secrets`, 공개 값은 `vars`로 구분

## ➡️ 다음 단계 연결

운영 가능한 배포 파이프라인이 생겼습니다. [study18](./study18.md)에서는 이 서비스에 **AI 기능**(요약·챗)을 붙이고, 개발 도구와 연결하는 **MCP**의 기초를 다룹니다.
