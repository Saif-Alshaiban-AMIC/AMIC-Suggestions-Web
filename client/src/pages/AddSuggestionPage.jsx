import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, MenuItem,
  CircularProgress, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { submitSuggestion } from '../api/suggestions';
import { B, fieldSx } from '../theme';

const T = {
  en: {
    appTitle: 'AMIC Employee Suggestions',
    heading: 'Share Your Idea',
    sub: 'Help us build a better workplace',
    name: 'Full Name',
    id: 'Employee ID',
    dept: 'Department',
    selectDept: 'Select department',
    category: 'Category',
    selectCat: 'Select category',
    title: 'Suggestion Title',
    titlePlaceholder: 'Brief title for your suggestion',
    desc: 'Description',
    descPlaceholder: 'Describe your suggestion in detail. What is the problem? What is your proposed solution? What benefits do you expect?',
    submit: 'Submit Suggestion',
    successTitle: 'Thank You!',
    successMsg: 'Your suggestion has been submitted successfully. We appreciate your contribution to improving our workplace.',
    submitAnother: 'Submit Another',
    error: 'Failed to submit. Please try again.',
  },
  ar: {
    appTitle: 'مقترحات موظفي AMIC',
    heading: 'شارك فكرتك',
    sub: 'ساعدنا في بناء بيئة عمل أفضل',
    name: 'الاسم الكامل',
    id: 'الرقم الوظيفي',
    dept: 'الإدارة',
    selectDept: 'اختر الإدارة',
    category: 'التصنيف',
    selectCat: 'اختر التصنيف',
    title: 'عنوان المقترح',
    titlePlaceholder: 'عنوان مختصر للمقترح',
    desc: 'التفاصيل',
    descPlaceholder: 'اشرح مقترحك بالتفصيل. ما هي المشكلة؟ ما هو الحل المقترح؟ ما الفوائد المتوقعة؟',
    submit: 'إرسال المقترح',
    successTitle: 'شكراً لك!',
    successMsg: 'تم إرسال مقترحك بنجاح. نقدر مساهمتك في تحسين بيئة العمل.',
    submitAnother: 'إرسال مقترح آخر',
    error: 'فشل الإرسال. يرجى المحاولة مرة أخرى.',
  },
};

const CATEGORIES = {
  en: ['Work Environment', 'Processes & Efficiency', 'Technology & Tools', 'Training & Development', 'Health & Safety', 'Culture & Engagement', 'Other'],
  ar: ['بيئة العمل', 'العمليات والكفاءة', 'التقنية والأدوات', 'التدريب والتطوير', 'الصحة والسلامة', 'الثقافة والانخراط', 'أخرى'],
};

const DEPARTMENTS = [
  { en: 'Business Development', ar: 'تطوير الأعمال' },
  { en: 'Business Process', ar: 'عمليات الأعمال' },
  { en: 'Contracts and Compliance', ar: 'العقود والامتثال' },
  { en: 'Engineering & RD', ar: 'الهندسة والبحث والتطوير' },
  { en: 'Executive', ar: 'الإدارة التنفيذية' },
  { en: 'Finance', ar: 'المالية' },
  { en: 'HR', ar: 'الموارد البشرية' },
  { en: 'IPP', ar: 'برنامج المشاركة الصناعية' },
  { en: 'IT & MIS', ar: 'تقنية المعلومات ونظم المعلومات الإدارية' },
  { en: 'Projects', ar: 'المشاريع' },
  { en: 'Supply Chain', ar: 'سلسلة الإمداد' },
];

const empty = { employeeName: '', employeeId: '', department: '', category: '', title: '', description: '' };

export default function AddSuggestionPage() {
  const [lang, setLang] = useState('en');
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const t = T[lang];
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitSuggestion(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t.error);
    } finally {
      setLoading(false);
    }
  };

  const LangToggle = (
    <ToggleButtonGroup value={lang} exclusive onChange={(_, v) => v && setLang(v)} size="small"
      sx={{ ml: 'auto' }}>
      <ToggleButton value="en" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700, px: 2,
        '&.Mui-selected': { bgcolor: B.peach, color: B.blue, borderColor: B.peach } }}>EN</ToggleButton>
      <ToggleButton value="ar" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700, px: 2,
        '&.Mui-selected': { bgcolor: B.peach, color: B.blue, borderColor: B.peach } }}>ع</ToggleButton>
    </ToggleButtonGroup>
  );

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, display: 'flex', flexDirection: 'column' }} dir={dir}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{t.appTitle}</Typography>
          {LangToggle}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Paper elevation={4} sx={{ p: 5, maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: B.green, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: B.blue, mb: 1 }}>{t.successTitle}</Typography>
            <Typography sx={{ color: B.brown, mb: 3 }}>{t.successMsg}</Typography>
            <Button variant="contained" onClick={() => { setSuccess(false); setForm(empty); }}
              sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
              {t.submitAnother}
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, display: 'flex', flexDirection: 'column' }} dir={dir}>
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{t.appTitle}</Typography>
        {LangToggle}
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', p: 2, pb: 4 }}>
        <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, width: '100%', maxWidth: 640 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <LightbulbOutlinedIcon sx={{ color: B.peach, fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: B.blue, lineHeight: 1.2 }}>{t.heading}</Typography>
              <Typography variant="body2" sx={{ color: B.brown }}>{t.sub}</Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label={t.name} required fullWidth sx={fieldSx}
                value={form.employeeName} onChange={set('employeeName')} />
              <TextField label={t.id} required fullWidth sx={fieldSx}
                value={form.employeeId} onChange={set('employeeId')} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label={t.dept} select fullWidth sx={fieldSx}
                value={form.department} onChange={set('department')}>
                <MenuItem value=""><em>{t.selectDept}</em></MenuItem>
                {DEPARTMENTS.map(d => (
                  <MenuItem key={d.en} value={d.en}>{isAr ? d.ar : d.en}</MenuItem>
                ))}
              </TextField>
              <TextField label={t.category} select fullWidth sx={fieldSx}
                value={form.category} onChange={set('category')}>
                <MenuItem value=""><em>{t.selectCat}</em></MenuItem>
                {CATEGORIES[lang].map((c, i) => (
                  <MenuItem key={i} value={CATEGORIES.en[i]}>{c}</MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField label={t.title} fullWidth required sx={{ ...fieldSx, mb: 2 }}
              value={form.title} onChange={set('title')} placeholder={t.titlePlaceholder} />

            <TextField label={t.desc} fullWidth required multiline rows={5} sx={{ ...fieldSx, mb: 3 }}
              value={form.description} onChange={set('description')} placeholder={t.descPlaceholder} />

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.4, fontSize: 15, background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : t.submit}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
