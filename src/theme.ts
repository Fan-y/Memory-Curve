import { createTheme, type Shadows } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1',
      light: '#EEF2FF',
      dark: '#4F46E5',
    },
    secondary: {
      main: '#0EA5E9',
      light: '#F0F9FF',
    },
    success: {
      main: '#10B981',
      light: '#ECFDF5',
    },
    warning: {
      main: '#F59E0B',
      light: '#FFFBEB',
      dark: '#B45309',
    },
    error: {
      main: '#EF4444',
      light: '#FEF2F2',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
  },

  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Noto Sans SC"',
      'sans-serif',
    ].join(','),
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
  },

  shape: { borderRadius: 12 },

  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.04), 0px 1px 2px rgba(0,0,0,0.06)',
    '0px 2px 4px rgba(0,0,0,0.04), 0px 1px 4px rgba(0,0,0,0.06)',
    '0px 4px 8px rgba(0,0,0,0.04), 0px 2px 8px rgba(0,0,0,0.06)',
    '0px 6px 16px rgba(0,0,0,0.06), 0px 4px 12px rgba(0,0,0,0.06)',
    '0px 8px 24px rgba(0,0,0,0.08), 0px 4px 16px rgba(0,0,0,0.06)',
    '0px 12px 32px rgba(0,0,0,0.10), 0px 6px 20px rgba(0,0,0,0.06)',
    'none', 'none', 'none', 'none', 'none', 'none',
    'none', 'none', 'none', 'none', 'none', 'none',
    'none', 'none', 'none', 'none', 'none', 'none',
  ] as Shadows,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F1F5F9',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: 'none',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 20px',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.12), 0px 2px 4px rgba(0,0,0,0.08)',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        outlined: {
          borderColor: '#E2E8F0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#F1F5F9',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: 'none',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: '0 0 8px 0',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#F8FAFC',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
  },
})

export default theme
