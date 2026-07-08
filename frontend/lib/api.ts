import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

console.log('API BASE URL:', BASE);

async function token() {
  return AsyncStorage.getItem('orivo.token');
}

async function req(path: string, opts: RequestInit = {}) {
  const t = await token();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error((data && data.detail) || res.statusText || 'Request failed');
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p: string) => req(p),
  post: (p: string, body?: any) => req(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (p: string, body?: any) => req(p, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: (p: string) => req(p, { method: 'DELETE' }),
};

export async function setAuthToken(token: string | null) {
  if (token) await AsyncStorage.setItem('orivo.token', token);
  else await AsyncStorage.removeItem('orivo.token');
}

export async function getAuthToken() {
  return AsyncStorage.getItem('orivo.token');
}
