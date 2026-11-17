// study8: import.meta.env 는 이 파일에서만 읽는다. 변수 이름이 바뀌어도 한 파일만 고치면 된다.
export const env = {
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'Vue Study Demo',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL,
}
