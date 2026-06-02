import { useState, useEffect, useCallback } from 'react'
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Box,
  LinearProgress,
  IconButton,
  Paper,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded'
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import { db } from '../db/db'
import { formatDateFull } from '../utils/dates'
import type { Entry, Review } from '../types'

export default function History() {
  const [data, setData] = useState<(Entry & { reviews: Review[] })[]>([])

  const load = useCallback(async () => {
    const entries = await db.getAllEntriesWithReviews()
    setData(entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }, [])

  useEffect(() => { load() }, [load])

  const handleComplete = async (reviewId: number) => {
    await db.completeReview(reviewId)
    load()
  }

  return (
    <Box>
      {/* 头部 */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>
          历史记录
        </Typography>
        <Typography variant="body1" color="text.secondary">
          共 {data.length} 条学习记录，点击展开查看复习详情
        </Typography>
      </Box>

      {data.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 10, borderRadius: 2 }}>
          <Typography variant="h6" color="text.disabled" mb={1}>
            还没有学习记录
          </Typography>
          <Typography variant="body2" color="text.disabled">
            去添加你的第一条学习记录吧
          </Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {data.map((entry) => {
            const done = entry.reviews.filter((r) => r.completed).length
            const total = entry.reviews.length
            const progress = total > 0 ? (done / total) * 100 : 0

            return (
              <Accordion key={entry.id} sx={{ borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box flex={1} minWidth={0} display="flex" alignItems="center" gap={2}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {entry.title}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center" mt={0.25}>
                        <Typography variant="body2" color="text.disabled">
                          {formatDateFull(entry.createdAt)}
                        </Typography>
                        <Typography variant="body2" color="text.disabled">·</Typography>
                        <Typography variant="body2" color="text.disabled">
                          {done}/{total} 次复习
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ width: 160 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.disabled">复习进度</Typography>
                        <Typography variant="caption" fontWeight={600} color={progress === 100 ? 'success.main' : 'primary'}>
                          {Math.round(progress)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={progress === 100 ? 'success' : 'primary'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {entry.description && (
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      mb={2}
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {entry.description}
                    </Typography>
                  )}

                  {entry.source && (
                    <Typography variant="body2" color="text.disabled" mb={2}>
                      来源：{entry.source}
                    </Typography>
                  )}

                  {entry.tags.length > 0 && (
                    <Box display="flex" gap={0.5} flexWrap="wrap" mb={2.5}>
                      {entry.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}

                  <Typography variant="subtitle1" fontWeight={600} mb={2}>复习安排</Typography>

                  <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1.5}>
                    {entry.reviews.map((r) => (
                      <Paper
                        key={r.id}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          opacity: r.completed ? 0.55 : 1,
                          bgcolor: r.completed ? 'grey.50' : 'background.paper',
                          boxShadow: r.completed
                            ? 'none'
                            : '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
                          borderRadius: 2,
                          transition: 'all 0.15s ease',
                          '&:hover': r.completed ? {} : { boxShadow: '0px 4px 12px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.04)' },
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleComplete(r.id!)}
                          sx={{
                            color: r.completed ? 'success.main' : 'action.disabled',
                            '&:hover': { color: 'success.main', bgcolor: 'success.light' },
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {r.completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                        </IconButton>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            第 {r.reviewNumber} 次
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {formatDateFull(r.scheduledDate)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
