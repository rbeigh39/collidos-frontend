import { createContext } from "react";
import type { User, UserSettings } from "@/types";

export interface AuthContextValue {
  user: User | null;
  /** True while the initial session bootstrap (silent refresh) is in flight. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

// Defined in its own module so the provider component and the useAuth hook can
// both import it without creating a circular dependency (keeps fast-refresh happy).
export const AuthContext = createContext<AuthContextValue | null>(null);
