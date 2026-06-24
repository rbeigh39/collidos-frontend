import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, User, UserSettings } from "@/types";

/**
 * Profile API. Identity (sign in/up/out, session) is handled by the better-auth
 * client (see lib/authClient.ts); this module covers the app "profile" — the
 * authenticated user's record and settings, served at /api/profile.
 */

/** Best-effort browser timezone, used to seed settings on register. */
export function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** The current user + settings. 401 if there is no valid session. */
export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<ApiSuccess<{ user: User }>>("/profile");
  return data.data.user;
}

export async function updateSettings(
  settings: Partial<UserSettings>,
): Promise<User> {
  const { data } = await apiClient.patch<ApiSuccess<{ user: User }>>(
    "/profile/settings",
    settings,
  );
  return data.data.user;
}
