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

export async function list({ projectId }) {
  try {
    const res = await fetch(`http://localhost:4000/api/tasks?project_id=${projectId}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: body || { message: `HTTP ${res.status}` } };
    // L'API retourne { data: [...] }, on extrait le tableau
    return { data: body.data ?? body ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

export function create(payload) {
  return apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

export function getById(id) {
  return apiFetch(`/api/tasks/${id}`);
}