import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * Single Axios instance for the whole app.
 *
 * Auth model:
 *  - The access token lives in memory only (never localStorage) and is attached
 *    as a Bearer header on every request.
 *  - The refresh token is an httpOnly cookie the browser sends automatically to
 *    /api/auth; JS can't read it, which mitigates XSS token theft.
 *  - On a 401 we transparently call /auth/refresh once, then retry the request.
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send the refresh cookie
});

// ─── In-memory access token ──────────────────────────────────────────────
let accessToken: string | null = null;
// Called by the auth layer when the token is refreshed outside of a request.
let onTokenRefreshed: ((token: string | null) => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function onAuthTokenChange(cb: (token: string | null) => void): void {
  onTokenRefreshed = cb;
}

// ─── Request: attach the bearer token ──────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response: refresh-and-retry on 401 ────────────────────────────────────
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Dedupe concurrent refreshes so a burst of 401s triggers a single refresh.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<{ data: { accessToken: string } }>("/auth/refresh")
      .then((res) => res.data.data.accessToken)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes("/auth/refresh");

    if (status === 401 && original && !original._retried && !isRefreshCall) {
      original._retried = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        setAccessToken(newToken);
        onTokenRefreshed?.(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      // Refresh failed — the session is gone.
      setAccessToken(null);
      onTokenRefreshed?.(null);
    }

    return Promise.reject(error);
  },
);
