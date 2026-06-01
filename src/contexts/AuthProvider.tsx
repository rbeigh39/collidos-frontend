import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "@/api/auth";
import { onAuthTokenChange, setAccessToken } from "@/lib/apiClient";
import type { User, UserSettings } from "@/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // On first load, try a silent refresh to restore an existing session.
  useEffect(() => {
    let cancelled = false;

    authApi
      .refresh()
      .then(({ user: refreshedUser, accessToken }) => {
        if (cancelled) return;
        setAccessToken(accessToken);
        setUser(refreshedUser);
      })
      .catch(() => {
        // No valid session — that's expected for logged-out visitors.
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // If the apiClient gives up refreshing mid-session, drop the user.
  useEffect(() => {
    onAuthTokenChange((token) => {
      if (!token) setUser(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn, accessToken } = await authApi.login({ email, password });
    setAccessToken(accessToken);
    setUser(loggedIn);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: created, accessToken } = await authApi.register({
        name,
        email,
        password,
      });
      setAccessToken(accessToken);
      setUser(created);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
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
