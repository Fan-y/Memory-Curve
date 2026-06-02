import { useState, useEffect, useCallback } from 'react'
import { Typography, Box, Tabs, Tab, Button, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/AddRounded'
import ReviewCard from '../components/ReviewCard'
import StatsCard from '../components/StatsCard'
import { db } from '../db/db'
import type { Review, Entry } from '../types'

type ReviewWithEntry = Review & { entry: Entry }

export default function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [reviews, setReviews] = useState<ReviewWithEntry[]>([])
  const [overdue, setOverdue] = useState<ReviewWithEntry[]>([])
  const [stats, setStats] = useState({
    totalEntries: 0,
    todayCount: 0,
    todayDone: 0,
    overdueCount: 0,
    completionRate: 0,
    upcomingCount: 0,
  })

  const load = useCallback(async () => {
    const [todayReviews, overdueReviews, s] = await Promise.all([
      db.getTodayReviews(),
      db.getOverdueReviews(),
      db.getStats(),
    ])
    setReviews(todayReviews)
    setOverdue(overdueReviews)
    setStats(s)
  }, [])

  useEffect(() => { load() }, [load])

  const handleComplete = async (reviewId: number) => {
    await db.completeReview(reviewId)
    load()
  }

  const list = tab === 0 ? reviews : overdue

  return (
    <Box>
      {/* 头部 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            仪表盘
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {stats.todayCount > 0
              ? `今日有 ${stats.todayCount} 项复习任务等待你`
              : '今天没有待完成的复习'}
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => navigate('/add')}>
          添加记录
        </Button>
      </Box>

      {/* 统计卡片 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <StatsCard label="今日复习" value={stats.todayCount} subtitle={`${stats.todayDone} 已完成`} />
        <StatsCard label="逾期任务" value={stats.overdueCount} subtitle="尽快补上" color="#F59E0B" />
        <StatsCard label="完成率" value={`${stats.completionRate}%`} subtitle="总复习进度" color="#10B981" />
        <StatsCard label="即将到来" value={stats.upcomingCount} subtitle="未来复习" color="#0EA5E9" />
      </Box>

      {/* 逾期提醒横幅 */}
      {overdue.length > 0 && (
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            bgcolor: '#FFFBEB',
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            !
          </Box>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }} color="warning.dark">
              你有 {overdue.length} 条逾期未完成的复习
            </Typography>
            <Typography variant="body2" color="warning.dark" sx={{ opacity: 0.8 }}>
              尽快补上能更好地巩固记忆效果
            </Typography>
          </Box>
        </Paper>
      )}

      {/* 选项卡 */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5 }}>
        <Tab label={`今日复习${reviews.length > 0 ? `（${reviews.length}）` : ''}`} />
        <Tab label={`逾期未完成${overdue.length > 0 ? `（${overdue.length}）` : ''}`} />
      </Tabs>

      {/* 列表 */}
      {list.length === 0 ? (
        <Paper
          sx={{
            textAlign: 'center',
            py: 10,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" color="text.disabled" sx={{ mb: 1 }}>
            {tab === 0 ? '今天没有复习任务' : '没有逾期任务'}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {tab === 0 ? '去学习新知识，系统会自动安排复习' : '继续保持！'}
          </Typography>
          {tab === 0 && (
            <Button variant="outlined" size="large" startIcon={<AddIcon />} onClick={() => navigate('/add')}>
              添加学习记录
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {list.map((r) => <ReviewCard key={r.id} review={r} onComplete={handleComplete} />)}
        </Box>
      )}
    </Box>
  )
}
