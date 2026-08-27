const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
const API_BASE_URL = `${cleanBaseUrl}/api`;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Authorization Bearer token header if present in localStorage as cross-domain fallback
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        data: null as any,
        error: data.error || {
          code: 'HTTP_ERROR',
          message: data.message || `Request failed with status ${response.status}`,
        },
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Unable to connect to the CampusLift server',
      },
    };
  }
}
