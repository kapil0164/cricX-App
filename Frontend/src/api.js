// client/src/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ──────────────────────────────────────
export const getToken  = ()        => localStorage.getItem('cricx_token');
export const setToken  = (token)   => localStorage.setItem('cricx_token', token);
export const clearToken = ()       => localStorage.removeItem('cricx_token');

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Auth ───────────────────────────────────────────────
export async function signUp(name, email, password) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sign up failed');
  setToken(data.token);
  return data.user;
}

export async function signIn(email, password) {
  const res = await fetch(`${BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sign in failed');
  setToken(data.token);
  return data.user;
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) { clearToken(); return null; }
  const data = await res.json();
  return data.user;
}

export function signOut() {
  clearToken();
}

// ── Matches ────────────────────────────────────────────
export async function fetchHistory() {
  const res = await fetch(`${BASE}/matches`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function saveMatch(snapshot) {
  const { _id, ...body } = snapshot;
  const url    = _id ? `${BASE}/matches/${_id}` : `${BASE}/matches`;
  const method = _id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to save match');
  return res.json();
}

export async function deleteMatch(id) {
  const res = await fetch(`${BASE}/matches/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete match');
  return res.json();
}