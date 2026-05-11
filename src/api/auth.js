// Use a relative URL so the request goes through the same origin as the SPA.
// In dev, vite.config.js proxies /api -> http://localhost:4000.
// In prod, public/_redirects proxies /api -> https://taskflow-api01.onrender.com.
// Result: the auth cookie is first-party in the browser and never blocked
// by Edge/Chrome tracking prevention.
const BASE = '/api/auth';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export function signup({ email, password, organization_name }) {
  return request('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, organization_name }),
  });
}

export function login({ email, password }) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request('/logout', { method: 'POST' });
}

export function getMe() {
  return request('/me');
}