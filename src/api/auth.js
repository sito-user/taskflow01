// src/api/auth.js

const BASE = '/api/auth';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',          // send/receive httpOnly cookies
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