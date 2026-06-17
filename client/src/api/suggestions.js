import axios from 'axios';

const api = axios.create({ withCredentials: true });

export const submitSuggestion = (data) => api.post('/api/suggestions', data);

export const getSuggestions = () => api.get('/api/suggestions');

export const updateSuggestion = (id, data) => api.patch(`/api/suggestions/${id}`, data);

export const deleteSuggestion = (id) => api.delete(`/api/suggestions/${id}`);

export const bulkDelete = (ids) => api.delete('/api/suggestions', { data: { ids } });
