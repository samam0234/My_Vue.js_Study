# backend-django — 게시판 API (공통 API 스펙 v1)

Django 로 구현한 게시판 백엔드입니다. 프론트(`project/midpoint`, `project/final`)는 이 서버든 `project/midpoint/server/api-server.js` 든 **스펙 v1 만 지키면 코드 수정 없이** 붙습니다. 학습 문서: [../study6.md](../study6.md), [../study7.md](../study7.md).

## 실행

```sh
pip install -r requirements.txt
python manage.py migrate
python manage.py seed          # mina/joon (비밀번호 password123) + 샘플 글 10개
python manage.py runserver 8000
python manage.py test          # 스펙 v1 준수 테스트 23개
```

DB 는 기본 **SQLite**(설치 불필요). **MySQL** 은 `pip install mysqlclient` 후 환경변수로 켭니다.

```sh
DB_ENGINE=mysql DB_NAME=board DB_USER=board DB_PASSWORD=... DB_HOST=127.0.0.1 python manage.py migrate
```

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `DJANGO_SECRET_KEY` | 개발용 값 | **운영에서는 반드시 지정** (토큰 서명에도 쓰임) |
| `CORS_ORIGIN` | `http://localhost:5173` | 허용 출처. Vite·Nginx 프록시를 쓰면 필요 없음 |
| `TOKEN_MAX_AGE` | 7일(초) | 액세스 토큰 만료 |
| `DB_ENGINE` | sqlite | `mysql` 로 바꾸면 `DB_*` 사용 |

## 프론트 연결

```sh
# 방법 A — Vite 프록시 (CORS 불필요). midpoint/final 의 vite.config 가 /api → localhost:8000 으로 전달
cd ../project/midpoint && npm run dev
# 방법 B — 직접 호출 (CORS). 서버의 CORS_ORIGIN 과 프론트 주소가 같아야 한다
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

`project/final` 은 `.env.development.local` 에 `VITE_ENABLE_MOCK=false` 를 두면 MSW 대신 이 서버를 씁니다. 전체 스택은 저장소 루트에서 `docker compose up --build`.

## 구현 메모 (스펙 v1)

- 응답 `{ data }` / `{ data, meta }`, 오류 `{ error: { code, message, fields?, requestId } }`, 필드 camelCase, 시각 ISO 8601 UTC
- 인증: `Authorization: Bearer` + `django.core.signing` 서명 토큰(만료 검사). 비밀번호는 해시로만 저장, 응답에 없음
- 로그인 실패는 이메일·비밀번호 중 무엇이 틀렸는지 숨김(`INVALID_CREDENTIALS`), 서버 오류는 상세를 숨기고 로그에만 남김(`INTERNAL`)
- `X-Request-Id` 를 요청에서 받아 그대로 쓰고 없으면 생성, 오류 본문의 `requestId` 와 같은 값
