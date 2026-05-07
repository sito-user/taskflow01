'use strict';

const BASE_URL = (typeof process !== 'undefined' && process.env.API_BASE_URL) || 'http://localhost:4000';
const DEV_USER_ID = typeof window !== 'undefined' ? window.__DEV_USER_ID__ : null;

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': DEV_USER_ID || '',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: data || { message: `HTTP ${res.status}` } };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

function list({ projectId }) {
  return apiFetch(`/api/tasks?project_id=${projectId}`);
}

function create(payload) {
  return apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

function getById(id) {
  return apiFetch(`/api/tasks/${id}`);
}

module.exports = { list, create, getById };
