import dayjs from 'dayjs'

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function isToday(date: string): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

export function isBeforeToday(date: string): boolean {
  return dayjs(date).isBefore(dayjs(), 'day')
}

export function formatDate(date: string): string {
  const d = dayjs(date)
  if (d.isSame(dayjs(), 'day')) return '今天'
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return '明天'
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return '昨天'
  return d.format('MM/DD')
}

export function formatDateFull(date: string): string {
  return dayjs(date).format('YYYY年M月D日')
}

export function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = dayjs(new Date(year, month, 1))
  const daysInMonth = firstDay.daysInMonth()
  const startDayOfWeek = firstDay.day()

  const days: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

export function getMonthWeeks(year: number, month: number): (number | null)[][] {
  const firstDay = dayjs(new Date(year, month, 1))
  const daysInMonth = firstDay.daysInMonth()
  const startDayOfWeek = firstDay.day()

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) week.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

export function getMonthDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
