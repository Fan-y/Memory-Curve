import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  LinearProgress,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import type { Review, Entry } from '../types'
import { formatDateFull } from '../utils/dates'

interface Props {
  review: Review & { entry: Entry }
  onComplete: (id: number) => void
}

export default function ReviewCard({ review, onComplete }: Props) {
  return (
    <Card
      sx={{
        mb: 1.5,
        opacity: review.completed ? 0.55 : 1,
        transition: 'all 0.2s ease',
        '&:hover': { opacity: 1 },
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => onComplete(review.id!)}
            sx={{
              color: review.completed ? 'success.main' : 'action.disabled',
              '&:hover': { color: 'success.main', bgcolor: 'success.light' },
              transition: 'all 0.15s ease',
            }}
          >
            {review.completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          </IconButton>

          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {review.entry.title}
            </Typography>
            {review.entry.tags.length > 0 && (
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                {review.entry.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            )}
          </Box>

          <Box textAlign="right" minWidth={140}>
            <Typography variant="body2" fontWeight={600} color="primary">
              第 {review.reviewNumber}/6 次
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {formatDateFull(review.scheduledDate)}
            </Typography>
          </Box>

          <Box sx={{ width: 120 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.disabled">进度</Typography>
              <Typography variant="caption" fontWeight={600} color="primary">
                {Math.round((review.reviewNumber / 6) * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(review.reviewNumber / 6) * 100}
              sx={{ height: 5 }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
