import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/SaveRounded'
import BookmarkIcon from '@mui/icons-material/BookmarkBorderRounded'
import TagSelector from '../components/TagSelector'
import { db } from '../db/db'

export default function AddEntry() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  useEffect(() => {
    db.getAllTags().then((t) => setAllTags(t.map((t) => t.name)))
  }, [])

  const handleAddTag = async (name: string, color: string) => {
    await db.addTag(name, color)
    setAllTags((prev) => [...prev, name])
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await db.addEntry({
        title: title.trim(),
        description: description.trim(),
        source: source.trim(),
        tags,
      })
      setSnackbar('添加成功！')
      setTimeout(() => navigate('/'), 1000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box>
      {/* 标题区 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          添加学习记录
        </Typography>
        <Typography variant="body1" color="text.secondary">
          记录你学的内容，系统将按艾宾浩斯曲线自动安排 6 次复习
        </Typography>
      </Box>

      {/* 表单主体 */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* 主标题 —— 最重要的字段，用浅色背景突出 */}
        <Box sx={{ px: 4, pt: 4, pb: 3, bgcolor: '#F8FAFC' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Box
              sx={{
                width: 4,
                height: 20,
                borderRadius: 2,
                bgcolor: 'primary.main',
              }}
            />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              必填
            </Typography>
          </Box>
          <TextField
            placeholder="今天学的是什么？例如：HTML 基础标签"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
                fontSize: '1.05rem',
                '& input': {
                  py: 1.75,
                },
              },
            }}
          />
        </Box>

        <Divider />

        {/* 来源 + 标签 */}
        <Box sx={{ px: 4, py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BookmarkIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              分类信息（可选）
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <TextField
              label="来源"
              placeholder="书籍 / 视频 / 课程..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#F8FAFC',
                },
              }}
            />
            <TagSelector
              tags={tags}
              allTags={allTags}
              onChange={setTags}
              onAddTag={handleAddTag}
            />
          </Box>
        </Box>

        <Divider />

        {/* 描述 */}
        <Box sx={{ px: 4, py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BookmarkIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              详细描述（可选）
            </Typography>
          </Box>
          <TextField
            placeholder="记录重点内容、个人理解、疑问..."
            fullWidth
            multiline
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#F8FAFC',
              },
            }}
          />
        </Box>

        <Divider />

        {/* 操作按钮 */}
        <Box sx={{ px: 4, py: 2.5, display: 'flex', gap: 1.5, justifyContent: 'flex-end', bgcolor: '#FAFAFA' }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/')}
            sx={{ px: 3 }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            disabled={!title.trim() || saving}
            onClick={handleSubmit}
            sx={{ px: 4 }}
          >
            {saving ? '保存中…' : '保存'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  )
}
