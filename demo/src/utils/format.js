// study8: 반응형이 아닌 순수 함수는 utils/ 에 둔다.
export const formatPrice = (n) => `${Number(n).toLocaleString('ko-KR')}원`

export const formatDate = (iso) =>
  new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
