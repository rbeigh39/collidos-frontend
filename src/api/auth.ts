import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, User, UserSettings } from "@/types";

interface AuthPayload {
  user: User;
  accessToken: string;
}

/** Best-effort browser timezone, used to seed settings on register. */
function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const { data } = await apiClient.post<ApiSuccess<AuthPayload>>("/auth/register", {
    ...input,
    timezone: browserTimezone(),
  });
  return data.data;
}

export async function updateSettings(
  settings: Partial<UserSettings>,
): Promise<User> {
  const { data } = await apiClient.patch<ApiSuccess<{ user: User }>>(
    "/auth/settings",
    settings,
  );
  return data.data.user;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const { data } = await apiClient.post<ApiSuccess<AuthPayload>>(
    "/auth/login",
    input,
  );
  return data.data;
}

export async function refresh(): Promise<AuthPayload> {
  const { data } = await apiClient.post<ApiSuccess<AuthPayload>>("/auth/refresh");
  return data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<ApiSuccess<{ user: User }>>("/auth/me");
  return data.data.user;
}
