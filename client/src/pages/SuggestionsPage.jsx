import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, IconButton, Chip, TextField, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Checkbox, Tooltip, CircularProgress,
  Alert,
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

export default function SuggestionsPage() {
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
      total:      rows.length,
      pending:    rows.filter(r => r.status === 'Pending').length,
      implemented:rows.filter(r => r.status === 'Implemented').length,
      today:      rows.filter(r => dayjs(r.submittedAt).isAfter(today)).length,
      thisWeek:   rows.filter(r => dayjs(r.submittedAt).isAfter(weekStart)).length,
      thisMonth:  rows.filter(r => dayjs(r.submittedAt).isAfter(monthStart)).length,
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
    const headers = ['Title', 'Category', 'Department', 'Employee', 'Anonymous', 'Status', 'Admin Note', 'Submitted'];
    const csvRows = [headers.join(','), ...filtered.map(r => [
      esc(r.title), esc(r.category), esc(r.department),
      esc(r.anonymous ? 'Anonymous' : r.employeeName),
      esc(r.anonymous ? 'Yes' : 'No'),
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: B.grey, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)`, px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/logo.svg" alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18, flex: 1 }}>AMIC Employee Suggestions — Admin</Typography>
        <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout}
          sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff' } }}>
          Logout
        </Button>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {statCard('Total', stats.total)}
          {statCard('Pending', stats.pending, B.amber)}
          {statCard('Implemented', stats.implemented, B.green)}
          {statCard('Today', stats.today, B.lightBlue)}
          {statCard('This Week', stats.thisWeek, B.lightBlue)}
          {statCard('This Month', stats.thisMonth, B.lightBlue)}
        </Box>

        {/* Filters & Actions */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search title, description, name…" size="small" sx={{ ...fieldSx, minWidth: 240, flex: 1 }}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <FilterListIcon sx={{ color: B.brown, mr: 1, fontSize: 18 }} /> }}
            />
            <TextField select size="small" label="Status" sx={{ ...fieldSx, minWidth: 140 }}
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <MenuItem value="">All Statuses</MenuItem>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Category" sx={{ ...fieldSx, minWidth: 160 }}
              value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>

            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {selected.length > 0 && (
                <Button variant="contained" startIcon={<DeleteIcon />} onClick={() => setBulkConfirm(true)}
                  sx={{ bgcolor: B.danger, '&:hover': { bgcolor: B.dangerHov } }}>
                  Delete ({selected.length})
                </Button>
              )}
              <Button variant="outlined" onClick={exportCSV}
                sx={{ borderColor: B.blue, color: B.blue, '&:hover': { bgcolor: B.blue, color: '#fff' } }}>
                Export CSV
              </Button>
            </Box>
          </Box>
          <Typography sx={{ mt: 1, fontSize: 13, color: B.brown }}>
            Showing {filtered.length} of {rows.length} suggestions
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
                  {['Title', 'Category', 'Department', 'Submitted By', 'Date', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: B.brown }}>
                      <LightbulbOutlinedIcon sx={{ fontSize: 40, display: 'block', mx: 'auto', mb: 1, opacity: 0.3 }} />
                      No suggestions found
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
                          <Typography sx={{ fontSize: 11, color: B.brown, mt: 0.3 }}>Note: {row.adminNote}</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.category || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.department || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {row.anonymous ? <em style={{ color: B.brown }}>Anonymous</em> : row.employeeName || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {dayjs(row.submittedAt).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small"
                          sx={{ fontSize: 11, fontWeight: 600, borderRadius: 0,
                            bgcolor: STATUS_COLORS[row.status]?.bg,
                            color: STATUS_COLORS[row.status]?.color }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Update status / add note">
                            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: B.blue }}>
                              <EditNoteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
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
                  <Button size="small" variant={p === page ? 'contained' : 'outlined'}
                    onClick={() => setPage(p)}
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
          Suggestion Details
          <IconButton onClick={() => setViewRow(null)} sx={{ color: '#fff' }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        {viewRow && (
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={viewRow.status} size="small"
                sx={{ fontWeight: 600, borderRadius: 0, bgcolor: STATUS_COLORS[viewRow.status]?.bg, color: STATUS_COLORS[viewRow.status]?.color }} />
              {viewRow.anonymous && <Chip label="Anonymous" size="small" sx={{ borderRadius: 0, bgcolor: '#f5f5f5', color: B.brown }} />}
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: 18, color: B.blue, mb: 1 }}>{viewRow.title}</Typography>
            <Typography sx={{ color: '#333', mb: 3, lineHeight: 1.7 }}>{viewRow.description}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {[
                ['Category', viewRow.category || '—'],
                ['Department', viewRow.department || '—'],
                ['Submitted By', viewRow.anonymous ? 'Anonymous' : viewRow.employeeName || '—'],
                ['Date', dayjs(viewRow.submittedAt).format('MMM D, YYYY HH:mm')],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography sx={{ fontSize: 11, color: B.brown, textTransform: 'uppercase', fontWeight: 600 }}>{label}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#333' }}>{value}</Typography>
                </Box>
              ))}
            </Box>

            {viewRow.adminNote && (
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, mt: 1 }}>
                <Typography sx={{ fontSize: 11, color: B.brown, textTransform: 'uppercase', fontWeight: 600, mb: 0.5 }}>Admin Note</Typography>
                <Typography sx={{ fontSize: 14, color: '#333' }}>{viewRow.adminNote}</Typography>
              </Box>
            )}
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setViewRow(null); openEdit(viewRow); }} startIcon={<EditNoteIcon />}
            sx={{ color: B.blue }}>Edit Status</Button>
          <Button variant="contained" onClick={() => setViewRow(null)}
            sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onClose={() => setEditRow(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ bgcolor: B.blue, color: '#fff', fontWeight: 700 }}>
          Update Suggestion
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editRow && (
            <>
              <Typography sx={{ fontWeight: 600, color: B.blue, mb: 0.5 }}>{editRow.title}</Typography>
              <Typography sx={{ color: B.brown, fontSize: 13, mb: 2 }}>{editRow.description}</Typography>
              <TextField select fullWidth label="Status" sx={{ ...fieldSx, mb: 2 }}
                value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Admin Note (optional)" multiline rows={3} sx={fieldSx}
                value={editNote} onChange={e => setEditNote(e.target.value)}
                placeholder="Add a note visible only to admins" />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditRow(null)} sx={{ color: B.brown }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ background: `linear-gradient(135deg, ${B.blue} 0%, ${B.lightBlue} 100%)` }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle>Delete Suggestion?</DialogTitle>
        <DialogContent>This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: B.brown }}>Cancel</Button>
          <Button variant="contained" onClick={() => handleDelete(deleteConfirm)}
            sx={{ bgcolor: B.danger, '&:hover': { bgcolor: B.dangerHov } }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk delete confirm */}
      <Dialog open={bulkConfirm} onClose={() => setBulkConfirm(false)} PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle>Delete {selected.length} Suggestions?</DialogTitle>
        <DialogContent>This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConfirm(false)} sx={{ color: B.brown }}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkDelete}
            sx={{ bgcolor: B.danger, '&:hover': { bgcolor: B.dangerHov } }}>Delete All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
