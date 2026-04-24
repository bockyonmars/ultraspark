import { clearTokenCookie, getTokenFromCookie } from './session';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string;
  isPublic?: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ultrasparkcleaning.co.uk/api/v1';

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const token = options.token ?? (!options.isPublic ? getTokenFromCookie() : '');
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & {
    error?: unknown;
  };

  if (response.status === 401) {
    clearTokenCookie();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(payload.message ?? 'Unauthorized', 401);
  }

  if (!response.ok) {
    throw new ApiError(payload.message ?? 'Request failed', response.status);
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string, token?: string) => apiRequest<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body: unknown, isPublic = false) =>
    apiRequest<T>(path, { method: 'POST', body, isPublic }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body }),
};

export { API_URL };
