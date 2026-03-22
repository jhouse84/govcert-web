const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://govcert-production.up.railway.app';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!user || !refreshToken) return null;

  try {
    const { id: userId } = JSON.parse(user);
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && typeof window !== 'undefined') {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh().finally(() => { isRefreshing = false; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      // Retry with new token
      const retryRes = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) throw new Error(retryData.error || 'Request failed');
      return retryData;
    }
    // Refresh failed — redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  register: (body: { email: string; password: string; firstName: string; lastName: string }) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};
