export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function apiSignup(payload: SignupPayload) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Signup failed');
  return data as { user: any; token: string };
}

export async function apiLogin(payload: LoginPayload) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Login failed');
  return data as { user: any; token: string };
}
