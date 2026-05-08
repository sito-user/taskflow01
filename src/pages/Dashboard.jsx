// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout } from '../api/auth';
import '../styles/auth.css';

import TaskCreate from '../components/TaskCreate';
import TaskList from '../components/TaskList';

const PROJECT_ID = 'c1000000-0000-4000-8000-000000000001';

function getInitial(email) {
  return email ? email[0].toUpperCase() : '?';
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user ?? data);
      })
      .catch(() => {
        if (!cancelled) navigate('/login', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [navigate]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // best-effort: redirect regardless
    }
    navigate('/', { replace: true });
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="auth-page">
        <main className="auth-card" aria-busy="true">
          <div className="auth-brand">
            <div className="auth-brand-logo" role="img" aria-label="TaskFlow logo" />
            <span className="auth-brand-name">TaskFlow</span>
          </div>
          <p className="auth-loading">Loading…</p>
        </main>
      </div>
    );
  }

  /* ── API error (non-401) ── */
  if (error) {
    return (
      <div className="auth-page">
        <main className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-logo" role="img" aria-label="TaskFlow logo" />
            <span className="auth-brand-name">TaskFlow</span>
          </div>
          <p className="auth-error" role="alert">{error}</p>
        </main>
      </div>
    );
  }

  /* ── Authenticated ── */
return (
  <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '32px' }}>
    <main className="auth-card" style={{ maxWidth: '700px', width: '100%' }}>
      <div className="auth-brand">
        <div className="auth-brand-logo" role="img" aria-label="TaskFlow logo" />
        <span className="auth-brand-name">TaskFlow</span>
      </div>
      <hr className="auth-divider" />
      <p className="dashboard-welcome">Welcome back!</p>
      <p className="dashboard-email">{user?.email}</p>
      <hr className="auth-divider" />
      <TaskCreate
        projectId={user?.default_project_id || PROJECT_ID}
        onCreated={() => setRefresh(r => r + 1)}
      />
      <hr className="auth-divider" />
      <TaskList key={refresh} projectId={user?.default_project_id || PROJECT_ID} />
      <hr className="auth-divider" />
      <button
        type="button"
        className="btn-ghost"
        onClick={handleLogout}
        aria-label="Log out of TaskFlow"
      >
        Log out
      </button>
    </main>
  </div>
);
}