// study8: import.meta.env 는 이 파일에서만 읽는다.
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'Mini Board',
  baseUrl: import.meta.env.BASE_URL,
}
