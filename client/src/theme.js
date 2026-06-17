import { createTheme } from '@mui/material/styles';

export const B = {
  blue:      '#293940',
  lightBlue: '#3E5159',
  brown:     '#8C8979',
  peach:     '#F2B29B',
  grey:      '#F2F2F2',
  danger:    '#e53935',
  dangerHov: '#c62828',
  green:     '#2e7d32',
  greenHov:  '#1b5e20',
  amber:     '#f57c00',
};

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    '& fieldset': { borderColor: B.brown },
    '&:hover fieldset': { borderColor: B.blue },
    '&.Mui-focused fieldset': { borderColor: B.peach },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: B.peach },
};

const theme = createTheme({
  palette: {
    primary: { main: B.blue },
    secondary: { main: B.peach },
  },
  typography: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 0 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 0 } },
    },
  },
});

export default theme;
