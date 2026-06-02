import { Box, Typography } from '@mui/material'

interface Props {
  label: string
  value: string | number
  color?: string
  subtitle?: string
}

export default function StatsCard({ label, value, color, subtitle }: Props) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700 }} color={color ?? 'text.primary'}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }} color="text.secondary">
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.disabled">
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}
