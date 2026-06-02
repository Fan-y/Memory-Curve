import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/HomeRounded'
import AddCircleIcon from '@mui/icons-material/AddCircleRounded'
import HistoryIcon from '@mui/icons-material/HistoryRounded'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonthRounded'
import BarChartIcon from '@mui/icons-material/BarChartRounded'
import PsychologyIcon from '@mui/icons-material/Psychology'

const DRAWER_WIDTH = 240

const navItems = [
  { label: '仪表盘', icon: <HomeIcon />, path: '/' },
  { label: '添加记录', icon: <AddCircleIcon />, path: '/add' },
  { label: '日历', icon: <CalendarMonthIcon />, path: '/calendar' },
  { label: '历史', icon: <HistoryIcon />, path: '/history' },
  { label: '统计', icon: <BarChartIcon />, path: '/stats' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* 侧边栏 */}
      <Box
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          px: 2,
          py: 3,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: '#fff',
            }}
          >
            <PsychologyIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
              Memory Curve
            </Typography>
            <Typography variant="caption" color="text.disabled" fontWeight={500}>
              记忆曲线复习
            </Typography>
          </Box>
        </Box>

        {/* 导航 */}
        <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  bgcolor: active ? 'primary.light' : 'transparent',
                  color: active ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: active ? 'primary.light' : 'grey.50',
                    color: active ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& .MuiSvgIcon-root': { fontSize: 22 },
                }}>
                  {item.icon}
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={active ? 700 : 500}
                  fontSize="0.875rem"
                >
                  {item.label}
                </Typography>
                {active && (
                  <Box
                    sx={{
                      ml: 'auto',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                    }}
                  />
                )}
              </Box>
            )
          })}
        </Box>

        {/* 底部装饰 */}
        <Box sx={{ mt: 'auto', px: 1 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              今日事 · 今日毕
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 主内容 */}
      <Box
        component="main"
        sx={{
          flex: 1,
          px: 6,
          py: 4,
          maxWidth: 1200,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
