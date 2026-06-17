import axios from 'axios';

const api = axios.create({ withCredentials: true });

export const login = (username, password) =>
  api.post('/api/auth/login', { username, password });

export const logout = () => api.post('/api/auth/logout');

export const getMe = () => api.get('/api/auth/me');
