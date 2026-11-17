# study17: 멀티 스테이지 빌드 — node 에서 빌드하고, 결과(dist)만 nginx 이미지에 담는다.

# ---------- 1단계: 빌드 ----------
FROM node:26-alpine AS build
WORKDIR /app

# 의존성 설치를 먼저 해서, 소스만 바뀌면 이 레이어 캐시를 재사용한다.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* 값은 "빌드 시점"에 번들에 박힌다. 런타임 -e 로는 바꿀 수 없다.
# 비밀 값을 ARG/ENV 로 넘기지 않는다 (이미지 레이어에 기록된다).
ARG VITE_API_BASE_URL=""
ARG VITE_APP_TITLE="Mini Board"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_TITLE=$VITE_APP_TITLE \
    VITE_ENABLE_MOCK=false

# build 스크립트가 type-check 를 포함한다. 타입 오류가 있으면 이미지 빌드가 실패한다.
RUN npm run build

# ---------- 2단계: 실행 ----------
FROM nginx:1.27-alpine AS runtime

# 공식 nginx 이미지는 /etc/nginx/templates/*.template 의 ${ENV} 를 시작 시 치환해 conf.d 에 둔다.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

# /api, /api/ai 를 넘겨줄 백엔드 주소 (docker compose 의 서비스 이름)
ENV API_UPSTREAM=http://backend:8000 \
    AI_UPSTREAM=http://ai-proxy:8787

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
