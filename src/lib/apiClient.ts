import axios, { AxiosError, AxiosInstance } from "axios";

/**
 * Single Axios instance for the whole app.
 *
 * Auth model (better-auth):
 *  - Authentication is a server-side session backed by an httpOnly cookie that
 *    the browser sends automatically. There is no access token in JS.
 *  - `withCredentials` ensures the session cookie rides along. For the cookie to
 *    be first-party (and therefore reliable across browsers), the API must be
 *    served same-origin with the SPA — in dev via the Vite proxy, in production
 *    via a reverse proxy. See docs/features/auth-and-sessions.md.
 *  - On a 401 we notify the auth layer so it can drop the user; we do not retry.
 */

// VITE_API_BASE_URL is the API *origin* (no path), matching authClient — which
// lets better-auth append `/api/auth/*`. We append `/api` for the REST routes.
// Unset (dev): fall back to the SPA origin so the Vite proxy handles `/api`.
const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL || window.location.origin
).replace(/\/$/, "");
const baseURL = `${apiOrigin}/api`;

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send the session cookie
});

// ─── Unauthorized handling ─────────────────────────────────────────────────
let onUnauthorized: (() => void) | null = null;

/** Registered by the auth layer; called when a request comes back 401. */
export function setUnauthorizedHandler(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
