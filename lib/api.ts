const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://govcert-production.up.railway.app';

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
