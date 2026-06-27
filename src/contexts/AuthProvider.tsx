import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "@/api/auth";
import { setUnauthorizedHandler } from "@/lib/apiClient";
import { authClient } from "@/lib/authClient";
import type { User, UserSettings } from "@/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // On first load, fetch the profile. A valid session cookie → the user is
  // restored; otherwise the request 401s and we stay logged out.
  useEffect(() => {
    let cancelled = false;

    authApi
      .fetchMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // No valid session — expected for logged-out visitors.
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // If any request comes back 401 mid-session, drop the user.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      // Carry the code so the page can special-case e.g. EMAIL_NOT_VERIFIED.
      throw Object.assign(new Error(error.message || "Unable to sign in"), {
        code: error.code,
      });
    }
    setUser(await authApi.fetchMe());
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        // Seed the timezone from the browser so rollover works out of the box.
        timezone: authApi.browserTimezone(),
      });
      if (error) throw new Error(error.message || "Unable to create account");
      // Email verification is required: signup does NOT create a session. The
      // caller shows a "check your email" state instead of entering the app.
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    const updated = await authApi.updateSettings(settings);
    setUser(updated);
  }, []);

  // Derive auth state during render rather than syncing it in an effect.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      updateSettings,
    }),
    [user, isBootstrapping, login, register, logout, updateSettings],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
