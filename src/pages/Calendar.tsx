import { useState, useEffect, useCallback } from 'react'
import {
  Typography,
  Box,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded'
import { db } from '../db/db'
import { getMonthWeeks, getMonthDate, isToday, formatDateFull } from '../utils/dates'
import type { Entry, Review } from '../types'

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [reviewMap, setReviewMap] = useState<Map<string, { completed: number; total: number }>>(new Map())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<(Entry & { reviews: Review[] })[]>([])

  const load = useCallback(async () => {
    const all = await db.getAllEntriesWithReviews()
    const map = new Map<string, { completed: number; total: number }>()
    for (const entry of all) {
      for (const r of entry.reviews) {
        const key = r.scheduledDate
        const cur = map.get(key) || { completed: 0, total: 0 }
        cur.total++
        if (r.completed) cur.completed++
        map.set(key, cur)
      }
    }
    setReviewMap(map)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDayClick = async (day: number) => {
    const date = getMonthDate(year, month, day)
    setSelectedDate(date)
    const entries = await db.getEntriesByDate(date)
    setSelectedEntries(entries)
  }

  const weeks = getMonthWeeks(year, month)
  const monthLabel = `${year}年${month + 1}月`

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonth(m)
    setYear(y)
  }

  return (
    <Box>
      {/* 头部 */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>
          复习日历
        </Typography>
        <Typography variant="body1" color="text.secondary">
          按月查看复习任务分布，点击日期查看详情
        </Typography>
      </Box>

      {/* 日历主体 */}
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {/* 月份导航 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <IconButton size="large" onClick={() => changeMonth(-1)} sx={{ color: 'text.secondary' }}>
            <ChevronLeftIcon fontSize="large" />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            {monthLabel}
          </Typography>
          <IconButton size="large" onClick={() => changeMonth(1)} sx={{ color: 'text.secondary' }}>
            <ChevronRightIcon fontSize="large" />
          </IconButton>
        </Box>

        {/* 星期行 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 1.5,
          }}
        >
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <Box key={d} sx={{ textAlign: 'center', py: 0.75 }}>
              <Typography variant="body1" color="text.disabled" fontWeight={600}>
                {d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 每周行 */}
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.75,
              mb: wi < weeks.length - 1 ? 0.75 : 0,
            }}
          >
            {week.map((day, di) => {
              if (day === null) {
                return (
                  <Box key={`e-${wi}-${di}`} sx={{ minHeight: 60 }} />
                )
              }
              const date = getMonthDate(year, month, day)
              const info = reviewMap.get(date)
              const today = isToday(date)
              const hasReviews = info && info.total > 0

              return (
                <Box
                  key={date}
                  onClick={() => handleDayClick(day)}
                  sx={{
                    minHeight: 60,
                    p: 0.75,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    bgcolor: today
                      ? 'primary.main'
                      : hasReviews
                        ? 'primary.light'
                        : 'transparent',
                    color: today
                      ? '#fff'
                      : hasReviews
                        ? 'primary.dark'
                        : 'text.primary',
                    fontWeight: today ? 700 : hasReviews ? 600 : 400,
                    border: !today ? '1px solid' : 'none',
                    borderColor: hasReviews ? 'primary.200' : 'divider',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: today
                        ? '0px 4px 12px rgba(99,102,241,0.4)'
                        : '0px 2px 8px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Typography variant="body1" fontWeight="inherit">
                    {day}
                  </Typography>
                  {hasReviews && (
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color={today ? 'inherit' : 'text.secondary'}
                      sx={{ opacity: today ? 0.9 : 0.7, mt: 0.25 }}
                    >
                      {info!.completed}/{info!.total}
                    </Typography>
                  )}
                  {today && !hasReviews && (
                    <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.25 }}>
                      今天
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        ))}
      </Paper>

      {/* 日期详情弹窗 */}
      <Dialog
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            {selectedDate ? formatDateFull(selectedDate) : ''}
            <Typography component="span" variant="h6" color="text.secondary" fontWeight={400}>
              {' '}的复习
            </Typography>
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedEntries.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.disabled">当天没有复习安排</Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {selectedEntries.map((entry) => (
                <Paper
                  key={entry.id}
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    {entry.title}
                  </Typography>
                  {entry.tags.length > 0 && (
                    <Box display="flex" gap={0.5} mb={1.5}>
                      {entry.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                  <Box display="flex" gap={0.75} flexWrap="wrap">
                    {entry.reviews.map((r) => (
                      <Chip
                        key={r.id}
                        label={`第${r.reviewNumber}次`}
                        size="small"
                        color={r.completed ? 'success' : 'default'}
                        variant={r.completed ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedDate(null)} variant="outlined" size="large">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
