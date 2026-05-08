const BASE_URL = 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
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

export function list({ projectId }) {
  return apiFetch(`/api/tasks?project_id=${projectId}`);
}

export function create(payload) {
  return apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

export function getById(id) {
  return apiFetch(`/api/tasks/${id}`);
}