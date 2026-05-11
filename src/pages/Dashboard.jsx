import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout } from '../api/auth';
import TaskCreate from '../components/TaskCreate';
import TaskList from '../components/TaskList';
import '../styles/auth.css';

function getInitial(email) {
  return email ? email[0].toUpperCase() : '?';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [refresh, setRefresh]     = useState(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? data);
          setProjectId(data.project_id ?? null);
        }
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
  try { await logout(); } catch {}
  window.location.href = '/login';
}

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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* NAVBAR */}
      <nav style={{
        background: '#1B5E20', color: 'white', padding: '0 32px',
        height: '56px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="auth-brand-logo" role="img" aria-label="TaskFlow logo" />
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>TaskFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', opacity: 0.9 }}>{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out of TaskFlow"
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px',
              padding: '6px 16px', cursor: 'pointer', fontSize: '14px'
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 16px' }}>
        
        {/* Welcome card */}
        <div style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div className="dashboard-avatar" aria-hidden="true">
            {getInitial(user?.email)}
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>Welcome back!</p>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{user?.email}</p>
          </div>
        </div>

        {/* Task Create */}
        {projectId ? (
          <div style={{
            background: 'white', borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px',
            overflow: 'hidden'
          }}>
            <TaskCreate
              projectId={projectId}
              onCreated={() => setRefresh(r => r + 1)}
            />
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px',
            textAlign: 'center', color: '#999'
          }}>
            <p>No project found. Please contact your administrator.</p>
          </div>
        )}

        {/* Task List */}
        {projectId && (
          <div style={{
            background: 'white', borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden'
          }}>
            <TaskList key={refresh} projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}