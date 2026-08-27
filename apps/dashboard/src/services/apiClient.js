import { useAuthStore } from '../store/authStore';

export class ApiError extends Error {
  constructor(code, message, details, status) {
    super(message || 'An API error occurred');
    this.name = 'ApiError';
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details || null;
    this.status = status || 500;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.kisansetu.app/api/v1';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken && data?.user) {
      useAuthStore.getState().setSession(data.user, data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, headers = {}, retry = true } = {}) {
  const { accessToken } = useAuthStore.getState();

  const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };

  try {
    const res = await fetch(fullUrl, {
      method,
      headers: defaultHeaders,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/refresh');
    if (res.status === 401 && retry && !isAuthRoute) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefresh();
        isRefreshing = false;

        if (newToken) {
          onRefreshed(newToken);
          return request(path, { method, body, headers, retry: false });
        } else {
          useAuthStore.getState().clear();
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isProtectedRoute =
            currentPath.startsWith('/buyer') ||
            currentPath.startsWith('/fpo') ||
            currentPath.startsWith('/admin');
          if (isProtectedRoute && !currentPath.startsWith('/login')) {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
          throw new ApiError('UNAUTHORIZED', 'Session expired. Please log in again.', null, 401);
        }
      } else {
        // Wait for token refresh
        const retryOriginal = new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              resolve(request(path, { method, body, headers, retry: false }));
            } else {
              reject(new ApiError('UNAUTHORIZED', 'Session expired', null, 401));
            }
          });
        });
        return retryOriginal;
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = data?.error || {};
      throw new ApiError(
        err.code || `HTTP_${res.status}`,
        err.message || res.statusText || 'Request failed',
        err.details,
        res.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('NETWORK_ERROR', error.message || 'Network connection error', null, 0);
  }
}

export const apiClient = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body, ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
  tryRefresh,
};
