import { useState, useEffect, useCallback } from 'react'
import {
  Typography,
  Box,
  Paper,
  Grid,
  LinearProgress,
} from '@mui/material'
import { db } from '../db/db'

export default function Stats() {
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalReviews: 0,
    completedReviews: 0,
    completionRate: 0,
    todayCount: 0,
    todayDone: 0,
    overdueCount: 0,
    upcomingCount: 0,
  })

  const load = useCallback(async () => {
    const s = await db.getStats()
    setStats(s)
  }, [])

  useEffect(() => { load() }, [load])

  const todayProgress = stats.todayCount > 0 ? Math.round((stats.todayDone / stats.todayCount) * 100) : 0

  return (
    <Box>
      {/* 头部 */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>
          学习统计
        </Typography>
        <Typography variant="body1" color="text.secondary">
          总览你的学习与复习数据
        </Typography>
      </Box>

      {/* 总览数字 - 4列 */}
      <Grid container spacing={3} mb={4}>
        {[
          { label: '总学习条目', value: stats.totalEntries, color: '#6366F1' },
          { label: '总复习次数', value: stats.totalReviews, color: '#0EA5E9' },
          { label: '已完成复习', value: stats.completedReviews, color: '#10B981' },
          { label: '完成率', value: `${stats.completionRate}%`, color: '#8B5CF6' },
        ].map((s) => (
          <Grid size={{ xs: 6, md: 3 }} key={s.label}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                textAlign: 'center',
                boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Typography variant="h3" fontWeight={700} color={s.color}>
                {s.value}
              </Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary" mt={0.5}>
                {s.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 今日 + 总体 双栏 */}
      <Grid container spacing={3} mb={4}>
        {/* 今日概况 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)' }}>
            <Typography variant="h6" fontWeight={700} mb={2.5}>
              今日概况
            </Typography>

            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} mb={3}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={700}>{stats.todayCount}</Typography>
                <Typography variant="body2" color="text.disabled" mt={0.5}>待复习</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={700} color="success.main">{stats.todayDone}</Typography>
                <Typography variant="body2" color="text.disabled" mt={0.5}>已完成</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={700} color={stats.overdueCount > 0 ? 'warning.main' : 'text.primary'}>
                  {stats.overdueCount}
                </Typography>
                <Typography variant="body2" color="text.disabled" mt={0.5}>逾期</Typography>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1" fontWeight={500} color="text.secondary">今日进度</Typography>
              <Typography variant="body1" fontWeight={700} color="primary">{todayProgress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={todayProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        {/* 总体进度 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)' }}>
            <Typography variant="h6" fontWeight={700} mb={2.5}>
              总体进度
            </Typography>

            <Box textAlign="center" mb={2.5}>
              <Typography variant="h2" fontWeight={700} color="primary">
                {stats.completionRate}%
              </Typography>
              <Typography variant="body1" color="text.disabled">总复习完成率</Typography>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} textAlign="center">
              <Box>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {stats.completedReviews}
                </Typography>
                <Typography variant="body2" color="text.disabled" mt={0.5}>已完成</Typography>
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} color="text.secondary">
                  {stats.totalReviews - stats.completedReviews}
                </Typography>
                <Typography variant="body2" color="text.disabled" mt={0.5}>待完成</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 即将到来 */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={1}>
          即将到来的复习
        </Typography>
        <Typography variant="h2" fontWeight={700} color="primary">
          {stats.upcomingCount}
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={0.5}>
          未来还有 {stats.upcomingCount} 项复习任务等待你完成
        </Typography>
      </Paper>
    </Box>
  )
}
