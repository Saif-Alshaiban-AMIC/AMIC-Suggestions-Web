import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, IconButton, Chip, TextField, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Checkbox, Tooltip, CircularProgress,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { getSuggestions, updateSuggestion, deleteSuggestion, bulkDelete } from '../api/suggestions';
import { logout } from '../api/auth';
import { B, fieldSx } from '../theme';

const STATUSES = ['Pending', 'Under Review', 'Implemented', 'Rejected'];
const STATUS_COLORS = {
  'Pending':      { bg: '#fff3e0', color: '#e65100' },
  'Under Review': { bg: '#e3f2fd', color: '#1565c0' },
  'Implemented':  { bg: '#e8f5e9', color: '#2e7d32' },
  'Rejected':     { bg: '#ffebee', color: '#c62828' },
};

const PER_PAGE = 20;

const T = {
  en: {
    title: 'AMIC Employee Suggestions — Admin',
    logout: 'Logout',
    total: 'Total', pending: 'Pending', implemented: 'Implemented',
    today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month',
    search: 'Search title, description, name…',
    allStatuses: 'All Statuses', allCategories: 'All Categories',
    status: 'Status', category: 'Category',
    deleteBtn: 'Delete', exportCSV: 'Export CSV',
    showing: (f, t) => `Showing ${f} of ${t} suggestions`,
    colTitle: 'Title', colCategory: 'Category', colDept: 'Department',
    colEmployee: 'Employee', colId: 'ID', colDate: 'Date',
    colStatus: 'Status', colActions: 'Actions',
    noData: 'No suggestions found',
    viewTitle: 'Suggestion Details',
    empName: 'Employee Name', empId: 'Employee ID',
    dept: 'Department', cat: 'Category', date: 'Date',
    adminNote: 'Admin Note', editStatus: 'Edit Status', close: 'Close',
    updateTitle: 'Update Suggestion',
    statusLabel: 'Status', notePlaceholder: 'Add a note visible only to admins',
    noteLabel: 'Admin Note (optional)', cancel: 'Cancel', save: 'Save',
    deleteTitle: 'Delete Suggestion?', deleteMsg: 'This action cannot be undone.',
    bulkDeleteTitle: (n) => `Delete ${n} Suggestions?`,
    delete: 'Delete', deleteAll: 'Delete All',
    notePrefix: 'Note:',
  },
  ar: {
    title: 'مقترحات موظفي AMIC — المدير',
    logout: 'تسجيل الخروج',
    total: 'الإجمالي', pending: 'قيد الانتظار', implemented: 'منفذة',
    today: 'اليوم', thisWeek: 'هذا الأسبوع', thisMonth: 'هذا الشهر',
    search: 'بحث في العنوان، الوصف، الاسم…',
    allStatuses: 'كل الحالات', allCategories: 'كل التصنيفات',
    status: 'الحالة', category: 'التصنيف',
    deleteBtn: 'حذف', exportCSV: 'تصدير CSV',
    showing: (f, t) => `عرض ${f} من ${t} مقترح`,
    colTitle: 'العنوان', colCategory: 'التصنيف', colDept: 'الإدارة',
    colEmployee: 'الموظف', colId: 'الرقم الوظيفي', colDate: 'التاريخ',
    colStatus: 'الحالة', colActions: 'إجراءات',
    noData: 'لا توجد مقترحات',
    viewTitle: 'تفاصيل المقترح',
    empName: 'اسم الموظف', empId: 'الرقم الوظيفي',
    dept: 'الإدارة', cat: 'التصنيف', date: 'التاريخ',
    adminNote: 'ملاحظة المدير', editStatus: 'تعديل الحالة', close: 'إغلاق',
    updateTitle: 'تحديث المقترح',
    statusLabel: 'الحالة', notePlaceholder: 'أضف ملاحظة للمديرين فقط',
    noteLabel: 'ملاحظة المدير (اختياري)', cancel: 'إلغاء', save: 'حفظ',
    deleteTitle: 'حذف المقترح؟', deleteMsg: 'لا يمكن التراجع عن هذا الإجراء.',
    bulkDeleteTitle: (n) => `حذف ${n} مقترحات؟`,
    delete: 'حذف', deleteAll: 'حذف الكل',
    notePrefix: 'ملاحظة:',
  },
};

const STATUS_AR = {
  'Pending': 'قيد الانتظار',
  'Under Review': 'قيد المراجعة',
  'Implemented': 'منفذة',
  'Rejected': 'مرفوضة',
};

export default function SuggestionsPage() {
  const [lang, setLang]         = useState('en');
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage]         = useState(1);
  const [editRow, setEditRow]   = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkConfirm, setBulkConfirm]     = useState(false);
  const [viewRow, setViewRow]             = useState(null);
  const navigate = useNavigate();

  const t = T[lang];
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const load = useCallback(async () => {
    try {
      const { data } = await getSuggestions();
      setRows(data);
    } catch {
      // session likely expired
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => {
      const matchSearch = !q ||
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.employeeName?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || r.status === filterStatus;
      const matchCat    = !filterCat    || r.category === filterCat;
      return matchSearch && matchStatus && matchCat;
    });
  }, [rows, search, filterStatus, filterCat]);

  const stats = useMemo(() => {
    const today = dayjs().startOf('day');
    const weekStart = dayjs().startOf('week');
    const monthStart = dayjs().startOf('month');
    return {
      total:       rows.length,
      pending:     rows.filter(r => r.status === 'Pending').length,
      implemented: rows.filter(r => r.status === 'Implemented').length,
      today:       rows.filter(r => dayjs(r.submittedAt).isAfter(today)).length,
      thisWeek:    rows.filter(r => dayjs(r.submittedAt).isAfter(weekStart)).length,
      thisMonth:   rows.filter(r => dayjs(r.submittedAt).isAfter(monthStart)).length,
    };
  }, [rows]);

  const categories = useMemo(() => [...new Set(rows.map(r => r.category).filter(Boolean))], [rows]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allOnPageSelected = paged.length > 0 && paged.every(r => selected.includes(r._id));

  const toggleAll = () => {
    if (allOnPageSelected) setSelected(s => s.filter(id => !paged.find(r => r._id === id)));
    else setSelected(s => [...new Set([...s, ...paged.map(r => r._id)])]);
  };
  const toggleRow = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const openEdit = (row) => { setEditRow(row); setEditStatus(row.status); setEditNote(row.adminNote || ''); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateSuggestion(editRow._id, { status: editStatus, adminNote: editNote });
      setRows(rs => rs.map(r => r._id === data._id ? data : r));
      setEditRow(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await deleteSuggestion(id);
    setRows(rs => rs.filter(r => r._id !== id));
    setDeleteConfirm(null);
  };

  const handleBulkDelete = async () => {
    await bulkDelete(selected);
    setRows(rs => rs.filter(r => !selected.includes(r._id)));
    setSelected([]);
    setBulkConfirm(false);
  };

  const exportCSV = () => {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Title', 'Category', 'Department', 'Employee Name', 'Employee ID', 'Status', 'Admin Note', 'Submitted'];
    const csvRows = [headers.join(','), ...filtered.map(r => [
      esc(r.title), esc(r.category), esc(r.department),
      esc(r.employeeName), esc(r.employeeId),
      esc(r.status), esc(r.adminNote),
      esc(dayjs(r.submittedAt).format('YYYY-MM-DD HH:mm')),
    ].join(','))];
    const blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'suggestions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const statCard = (label, value, color = B.blue) => (
    <Paper elevation={1} sx={{ p: 2, minWidth: 100, textAlign: 'center', flex: 1 }}>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color }}>{value}</Typography>
      <Typography sx={{ fontSize: 12, color: B.brown }}>{label}</Typography>
    </Paper>
  );

  const statusLabel = (s) => isAr ? (STATUS_AR[s] || s) : s;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: B.grey, display: 'flex', flexDirection: 'column' }} dir={dir}>
      {/* Header */}
      <Box sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18, flex: 1 }}>{t.title}</Typography>
        <ToggleButtonGroup value={lang} exclusive onChange={(_, v) => v && setLang(v)} size="small" sx={{ mr: 1 }}>
          <ToggleButton value="en" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700, px: 2,
            '&.Mui-selected': { bgcolor: B.peach, color: B.blue, borderColor: B.peach } }}>EN</ToggleButton>
          <ToggleButton value="ar" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700, px: 2,
            '&.Mui-selected': { bgcolor: B.peach, color: B.blue, borderColor: B.peach } }}>ع</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout}
          sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff' } }}>
          {t.logout}
        </Button>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {statCard(t.total, stats.total)}
          {statCard(t.pending, stats.pending, B.amber)}
          {statCard(t.implemented, stats.implemented, B.green)}
          {statCard(t.today, stats.today, B.lightBlue)}
          {statCard(t.thisWeek, stats.thisWeek, B.lightBlue)}
          {statCard(t.thisMonth, stats.thisMonth, B.lightBlue)}
        </Box>

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder={t.search} size="small" sx={{ ...fieldSx, minWidth: 240, flex: 1 }}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <FilterListIcon sx={{ color: B.brown, mr: 1, fontSize: 18 }} /> }}
            />
            <TextField select size="small" label={t.status} sx={{ ...fieldSx, minWidth: 140 }}
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <MenuItem value="">{t.allStatuses}</MenuItem>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
            </TextField>
            <TextField select size="small" label={t.category} sx={{ ...fieldSx, minWidth: 160 }}
              value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
              <MenuItem value="">{t.allCategories}</MenuItem>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {selected.length > 0 && (
                <Button variant="contained" startIcon={<DeleteIcon />} onClick={() => setBulkConfirm(true)}
                  sx={{ bgcolor: B.danger, '&:hover': { bgcolor: B.dangerHov } }}>
                  {t.deleteBtn} ({selected.length})
                </Button>
              )}
              <Button variant="outlined" onClick={exportCSV}
                sx={{ borderColor: B.blue, color: B.blue, '&:hover': { bgcolor: B.blue, color: '#fff' } }}>
                {t.exportCSV}
              </Button>
            </Box>
          </Box>
          <Typography sx={{ mt: 1, fontSize: 13, color: B.brown }}>
            {t.showing(filtered.length, rows.length)}
          </Typography>
        </Paper>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={1}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: B.blue }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={allOnPageSelected} onChange={toggleAll} sx={{ color: '#fff', '&.Mui-checked': { color: B.peach } }} />
                  </TableCell>
                  {[t.colTitle, t.colCategory, t.colDept, t.colEmployee, t.colId, t.colDate, t.colStatus, t.colActions].map(h => (
                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: B.brown }}>
                      <LightbulbOutlinedIcon sx={{ fontSize: 40, display: 'block', mx: 'auto', mb: 1, opacity: 0.3 }} />
                      {t.noData}
                    </TableCell>
                  </TableRow>
                ) : paged.map((row, i) => {
                  const sel = selected.includes(row._id);
                  return (
                    <TableRow key={row._id} onClick={() => setViewRow(row)}
                      sx={{ cursor: 'pointer', bgcolor: sel ? '#ffebee' : i % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: sel ? '#ffcdd2' : `${B.peach}22` } }}>
                      <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={sel} onChange={() => toggleRow(row._id)} sx={{ '&.Mui-checked': { color: B.danger } }} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Tooltip title={row.description} placement="top">
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: B.blue, cursor: 'help',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
                            {row.title}
                          </Typography>
                        </Tooltip>
                        {row.adminNote && (
                          <Typography sx={{ fontSize: 11, color: B.brown, mt: 0.3 }}>{t.notePrefix} {row.adminNote}</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.category || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.department || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.employeeName || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.employeeId || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {dayjs(row.submittedAt).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip label={statusLabel(row.status)} size="small"
                          sx={{ fontSize: 11, fontWeight: 600, borderRadius: 0,
                            bgcolor: STATUS_COLORS[row.status]?.bg,
                            color: STATUS_COLORS[row.status]?.color }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={t.editStatus}>
                            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: B.blue }}>
                              <EditNoteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t.delete}>
                            <IconButton size="small" onClick={() => setDeleteConfirm(row._id)} sx={{ color: B.danger }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <Typography sx={{ color: B.brown, alignSelf: 'center' }}>…</Typography>}
                  <Button size="small" variant={p === page ? 'contained' : 'outlined'} onClick={() => setPage(p)}
                    sx={{ minWidth: 36, borderRadius: 0,
                      ...(p === page ? { bgcolor: B.blue } : { borderColor: B.brown, color: B.brown }) }}>
                    {p}
                  </Button>
                </React.Fragment>
              ))}
          </Box>
        )}
      </Box>

      {/* View Dialog */}
      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ bgcolor: B.blue, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t.viewTitle}
          <IconButton onClick={() => setViewRow(null)} sx={{ color: '#fff' }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        {viewRow && (
          <DialogContent sx={{ pt: 3 }} dir={dir}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={statusLabel(viewRow.status)} size="small"
                sx={{ fontWeight: 600, borderRadius: 0, bgcolor: STATUS_COLORS[viewRow.status]?.bg, color: STATUS_COLORS[viewRow.status]?.color }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: B.blue, mb: 1 }}>{viewRow.title}</Typography>
            <Typography sx={{ color: '#333', mb: 3, lineHeight: 1.7 }}>{viewRow.description}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {[
                [t.empName, viewRow.employeeName || '—'],
                [t.empId, viewRow.employeeId || '—'],
                [t.dept, viewRow.department || '—'],
                [t.cat, viewRow.category || '—'],
                [t.date, dayjs(viewRow.submittedAt).format('MMM D, YYYY HH:mm')],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography sx={{ fontSize: 11, color: B.brown, textTransform: 'uppercase', fontWeight: 600 }}>{label}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#333' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            {viewRow.adminNote && (
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, mt: 1 }}>
                <Typography sx={{ fontSize: 11, color: B.brown, textTransform: 'uppercase', fontWeight: 600, mb: 0.5 }}>{t.adminNote}</Typography>
                <Typography sx={{ fontSize: 14, color: '#333' }}>{viewRow.adminNote}</Typography>
              </Box>
            )}
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setViewRow(null); openEdit(viewRow); }} startIcon={<EditNoteIcon />} sx={{ color: B.blue }}>{t.editStatus}</Button>
          <Button variant="contained" onClick={() => setViewRow(null)}
            sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>{t.close}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onClose={() => setEditRow(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ bgcolor: B.blue, color: '#fff', fontWeight: 700 }}>{t.updateTitle}</DialogTitle>
        <DialogContent sx={{ pt: 3 }} dir={dir}>
          {editRow && (
            <>
              <Typography sx={{ fontWeight: 600, color: B.blue, mb: 0.5 }}>{editRow.title}</Typography>
              <Typography sx={{ color: B.brown, fontSize: 13, mb: 2 }}>{editRow.description}</Typography>
              <TextField select fullWidth label={t.statusLabel} sx={{ ...fieldSx, mb: 2 }}
                value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
              </TextField>
              <TextField fullWidth label={t.noteLabel} multiline rows={3} sx={fieldSx}
                value={editNote} onChange={e => setEditNote(e.target.value)} placeholder={t.notePlaceholder} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditRow(null)} sx={{ color: B.brown }}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle>{t.deleteTitle}</DialogTitle>
        <DialogContent>{t.deleteMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: B.brown }}>{t.cancel}</Button>
          <Button variant="contained" onClick={() => handleDelete(deleteConfirm)}
            sx={{ bgcolor: B.danger, '&:hover': { bgcolor: B.dangerHov } }}>{t.delete}</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk delete confirm */}
      <Dialog open={bulkConfirm} onClose={() => setBulkConfirm(false)} PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle>{t.bulkDeleteTitle(selected.length)}</DialogTitle>
        <DialogContent>{t.deleteMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConfirm(false)} sx={{ color: B.brown }}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleBulkDelete}
            sx={{ bgcolor: B.danger, '&:hover': { bgcolor: B.dangerHov } }}>{t.deleteAll}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
