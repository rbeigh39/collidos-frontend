import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { SettingsModal } from "@/components/SettingsModal";

const NAV_ITEMS = [
  { label: "Today", icon: "◷", active: true },
  { label: "Week", icon: "▦", active: false },
  { label: "Backlog", icon: "≣", active: false },
  { label: "Archive", icon: "⌗", active: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-canvas text-ink">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
            ☼
          </span>
          <span className="font-semibold">Daily</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-ink-muted hover:bg-primary-soft/60"
              }`}
            >
              <span aria-hidden className="text-base">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <p className="px-3 text-sm font-medium text-ink">{user?.name}</p>
          <p className="px-3 text-xs text-ink-subtle">{user?.email}</p>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙ Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
