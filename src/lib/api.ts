/**
 * RideFlow Auth API
 * -----------------
 * All calls go through Vite's proxy → Flask at :5000
 * Session cookie is managed automatically by the browser.
 */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'rider' | 'driver' | 'admin';
}

export interface AuthResponse {
  success?: boolean;
  user: AuthUser;
  redirect: string;
}

export interface ApiError {
  error: string;
}

// ── Generic fetch wrapper ────────────────────────────────────────
async function apiFetch<T>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive session cookie
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw with the backend error message so UI can display it
    throw new Error((data as ApiError).error || 'Something went wrong');
  }

  return data as T;
}

// ── Sign In ──────────────────────────────────────────────────────
export async function apiSignIn(
  emailOrPhone: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    emailOrPhone,
    password,
  });
}

// ── Sign Up ──────────────────────────────────────────────────────
export interface SignUpPayload {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  role: 'Rider' | 'Driver';
  licenseNumber?: string;
  cnic?: string;
}

export async function apiSignUp(payload: SignUpPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/signup', {
    full_name:      payload.fullName,
    email:          payload.email,
    country_code:   payload.countryCode,
    phone:          payload.phone,
    password:       payload.password,
    role:           payload.role,
    license_number: payload.licenseNumber || '',
    cnic:           payload.cnic || '',
  });
}

// ── Sign Out ─────────────────────────────────────────────────────
export async function apiSignOut(): Promise<void> {
  await fetch('/logout', { credentials: 'include' });
}

// ── Session check (on page reload) ──────────────────────────────
export async function apiGetMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}
