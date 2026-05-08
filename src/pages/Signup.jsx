// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import '../styles/auth.css';

export default function Signup() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    email: '',
    organization_name: '',
    password: '',
  });
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
      await signup(fields);
      navigate('/dashboard');
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

        <h1 className="auth-heading">Create your account</h1>

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
            <label htmlFor="organization_name">Organization name</label>
            <input
              id="organization_name"
              name="organization_name"
              type="text"
              autoComplete="organization"
              required
              value={fields.organization_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
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
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </main>
    </div>
  );
}