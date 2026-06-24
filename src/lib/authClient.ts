import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * better-auth browser client. It talks to the auth handler mounted at
 * `<baseURL>/api/auth/*`. `baseURL` must resolve to the same origin the SPA is
 * served from (dev: the Vite proxy; prod: a same-origin reverse proxy) so the
 * session cookie is first-party.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || window.location.origin,
  plugins: [
    // Mirrors the server's `user.additionalFields` so signUp can carry timezone.
    inferAdditionalFields({
      user: { timezone: { type: "string", required: false } },
    }),
  ],
});
