// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';

import Dashboard from './pages/Dashboard';
import Login     from './pages/Login';
import Signup    from './pages/Signup';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);