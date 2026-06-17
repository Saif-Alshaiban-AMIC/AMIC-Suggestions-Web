import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, MenuItem,
  FormControlLabel, Checkbox, CircularProgress, Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { submitSuggestion } from '../api/suggestions';
import { B, fieldSx } from '../theme';

const CATEGORIES = ['Work Environment', 'Processes & Efficiency', 'Technology & Tools', 'Training & Development', 'Health & Safety', 'Culture & Engagement', 'Other'];
const DEPARTMENTS = [
  'Business Development / تطوير الأعمال',
  'Business Process / عمليات الأعمال',
  'Contracts and Compliance / العقود والامتثال',
  'Engineering & RD / الهندسة والبحث والتطوير',
  'Executive / الإدارة التنفيذية',
  'Finance / المالية',
  'HR / الموارد البشرية',
  'IPP / برنامج المشاركة الصناعية',
  'IT & MIS / تقنية المعلومات ونظم المعلومات الإدارية',
  'Projects / المشاريع',
  'Supply Chain / سلسلة الإمداد',
];

const empty = { employeeName: '', department: '', category: '', title: '', description: '', anonymous: false };

export default function AddSuggestionPage() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitSuggestion(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>AMIC Employee Suggestions</Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Paper elevation={4} sx={{ p: 5, maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: B.green, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: B.blue, mb: 1 }}>Thank You!</Typography>
            <Typography sx={{ color: B.brown, mb: 3 }}>Your suggestion has been submitted successfully. We appreciate your contribution to improving our workplace.</Typography>
            <Button variant="contained" onClick={() => { setSuccess(false); setForm(empty); }}
              sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
              Submit Another
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>AMIC Employee Suggestions</Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', p: 2, pb: 4 }}>
        <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, width: '100%', maxWidth: 640 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <LightbulbOutlinedIcon sx={{ color: B.peach, fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: B.blue, lineHeight: 1.2 }}>Share Your Idea</Typography>
              <Typography variant="body2" sx={{ color: B.brown }}>Help us build a better workplace</Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            {/* Anonymous toggle */}
            <FormControlLabel
              control={<Checkbox checked={form.anonymous} onChange={set('anonymous')} sx={{ color: B.brown, '&.Mui-checked': { color: B.blue } }} />}
              label={<Typography sx={{ color: B.brown, fontSize: 14 }}>Submit anonymously</Typography>}
              sx={{ mb: 2, ml: 0 }}
            />

            {!form.anonymous && (
              <TextField
                label="Your Name" fullWidth sx={{ ...fieldSx, mb: 2 }}
                value={form.employeeName} onChange={set('employeeName')}
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Department" select fullWidth sx={fieldSx}
                value={form.department} onChange={set('department')}>
                <MenuItem value=""><em>Select department</em></MenuItem>
                {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField
                label="Category" select fullWidth sx={fieldSx}
                value={form.category} onChange={set('category')}>
                <MenuItem value=""><em>Select category</em></MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Box>

            <TextField
              label="Suggestion Title" fullWidth required sx={{ ...fieldSx, mb: 2 }}
              value={form.title} onChange={set('title')}
              placeholder="Brief title for your suggestion"
            />

            <TextField
              label="Description" fullWidth required multiline rows={5} sx={{ ...fieldSx, mb: 3 }}
              value={form.description} onChange={set('description')}
              placeholder="Describe your suggestion in detail. What is the problem? What is your proposed solution? What benefits do you expect?"
            />

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.4, fontSize: 15, background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Submit Suggestion'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
