/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 서버 주소. 비우면 같은 출처(/api)로 요청한다 (Vite 프록시·Nginx 프록시). */
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  /** true면 MSW 목 서버로 API를 가로챈다 (백엔드 없이 개발·E2E). */
  readonly VITE_ENABLE_MOCK: string
  /** 설정하면 오류 보고를 이 주소로 sendBeacon 한다 (Sentry 등 대체 수단). */
  readonly VITE_ERROR_REPORT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
