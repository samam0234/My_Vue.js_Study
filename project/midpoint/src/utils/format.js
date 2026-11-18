export const formatDate = (iso) =>
  new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
