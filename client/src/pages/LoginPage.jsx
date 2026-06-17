import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { login } from '../api/auth';
import { B, fieldSx } from '../theme';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>AMIC Employee Suggestions</Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper elevation={4} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: B.blue, mb: 3 }}>Admin Login</Typography>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Username" fullWidth required sx={{ ...fieldSx, mb: 2 }}
              value={username} onChange={e => setUsername(e.target.value)}
            />
            <TextField
              label="Password" type="password" fullWidth required sx={{ ...fieldSx, mb: 3 }}
              value={password} onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.2, background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Login'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
