import { useState } from 'react'
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/AddRounded'
import LocalOfferIcon from '@mui/icons-material/LocalOfferRounded'

interface Props {
  tags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  onAddTag: (name: string, color: string) => void
}

const TAG_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

export default function TagSelector({ tags, allTags, onChange, onAddTag }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState('')

  const handleCreateTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !allTags.includes(trimmed)) {
      const color = TAG_COLORS[allTags.length % TAG_COLORS.length]
      onAddTag(trimmed, color)
    }
    setDialogOpen(false)
    setNewTag('')
  }

  return (
    <>
      <Autocomplete
        multiple
        freeSolo
        options={allTags}
        value={tags}
        onChange={(_, val) => onChange(val as string[])}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option}
              size="small"
              {...getTagProps({ index })}
              key={option}
              icon={<LocalOfferIcon sx={{ fontSize: 14 }} />}
              sx={{
                borderRadius: 1.5,
                fontWeight: 600,
                bgcolor: '#EEF2FF',
                color: '#4F46E5',
                '& .MuiChip-deleteIcon': { color: '#4F46E5', fontSize: 16 },
              }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="标签"
            placeholder="搜索或输入新标签..."
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#F8FAFC',
              },
            }}
          />
        )}
        noOptionsText={
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ cursor: 'pointer', py: 0.5 }}
            onClick={() => setDialogOpen(true)}
          >
            <AddIcon fontSize="small" color="primary" />
            <Typography color="primary" fontWeight={600} fontSize="0.875rem">
              创建新标签
            </Typography>
          </Box>
        }
        PaperComponent={(props) => (
          <Paper {...props} sx={{ borderRadius: 2, mt: 0.5 }} />
        )}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>新建标签</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            autoFocus
            label="标签名称"
            placeholder="输入标签名称..."
            fullWidth
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleCreateTag() }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">取消</Button>
          <Button onClick={handleCreateTag} variant="contained" disabled={!newTag.trim()}>
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
