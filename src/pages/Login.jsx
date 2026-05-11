// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import '../styles/auth.css';

export default function Login() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({ email: '', password: '' });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(fields);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <main className="auth-card">

        <div className="auth-brand">
          <div className="auth-brand-logo" role="img" aria-label="TaskFlow logo" />
          <span className="auth-brand-name">TaskFlow</span>
        </div>

        <h1 className="auth-heading">Welcome back</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={fields.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={fields.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      </main>
    </div>
  );
}