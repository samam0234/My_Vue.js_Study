// import.meta.env 는 이 파일에서만 읽는다 (study8).
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'Mini Board',
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
  errorReportUrl: import.meta.env.VITE_ERROR_REPORT_URL ?? '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL,
}
