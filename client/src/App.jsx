import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getMe } from './api/auth';
import AddSuggestionPage from './pages/AddSuggestionPage';
import LoginPage from './pages/LoginPage';
import SuggestionsPage from './pages/SuggestionsPage';

function AdminRoute({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    getMe().then(() => setAuth(true)).catch(() => setAuth(false));
  }, []);

  if (auth === null) return null;
  return auth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AddSuggestionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<SuggestionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
