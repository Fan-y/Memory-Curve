import dayjs from 'dayjs'
import { REVIEW_INTERVALS } from '../types'

export function getReviewSchedule(createdAt: string): string[] {
  const base = dayjs(createdAt)
  return REVIEW_INTERVALS.map((days) => base.add(days, 'day').format('YYYY-MM-DD'))
}
