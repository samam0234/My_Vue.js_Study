import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

/** API 의 createdAt(UTC ISO 8601)을 "3시간 전" 으로. */
export const fromNow = (iso: string) => dayjs(iso).fromNow()

/** 절대 시간 (툴팁용). */
export const formatDate = (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm')
