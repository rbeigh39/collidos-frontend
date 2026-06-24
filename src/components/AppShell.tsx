import {
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

const COLLAPSE_KEY = "sidebar:collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Derive the initial state from storage during render; persist on toggle.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true",
  );
  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });

  // Shared row styling for nav + footer controls.
  const rowClass = (active: boolean) =>
    `flex w-full items-center rounded-control px-3 py-2 text-sm transition-colors ${
      collapsed ? "justify-center" : "gap-3"
    } ${
      active
        ? "bg-primary-soft font-medium text-primary"
        : "text-ink-muted hover:bg-primary-soft/60"
    }`;

  return (
    <div className="flex h-screen bg-canvas text-ink">
      {/* Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-line bg-surface py-5 md:flex ${
          collapsed ? "w-16 px-2" : "w-60 px-3"
        }`}
      >
        {/* Brand + collapse toggle */}
        <div
          className={`mb-6 flex items-center px-1 ${
            collapsed ? "flex-col gap-3" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
              <Logo className="h-5 w-5" />
            </span>
            {!collapsed && <span className="font-semibold">Colloidos</span>}
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-primary-soft/60"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => navigate("/")}
            aria-label="Board"
            title={collapsed ? "Board" : undefined}
            className={rowClass(pathname === "/")}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed && "Board"}
          </button>
        </nav>

        {/* Footer: user + settings + sign out */}
        <div className="mt-auto border-t border-line pt-4">
          {!collapsed && (
            <div className="mb-1">
              <p className="truncate px-3 text-sm font-medium text-ink">
                {user?.name}
              </p>
              <p className="truncate px-3 text-xs text-ink-subtle">{user?.email}</p>
            </div>
          )}
          <button
            onClick={() => navigate("/settings")}
            aria-label="Settings"
            title={collapsed ? "Settings" : undefined}
            className={rowClass(pathname === "/settings")}
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed && "Settings"}
          </button>
          <button
            onClick={logout}
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
            className={rowClass(false)}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
