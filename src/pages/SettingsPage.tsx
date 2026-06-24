import { ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import type { UserSettings } from "@/types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function supportedTimezones(): string[] {
  // Intl.supportedValuesOf is widely available; fall back to a small list.
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intl.supportedValuesOf === "function") {
    return intl.supportedValuesOf("timeZone");
  }
  return ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Kolkata"];
}

/** A titled settings section: heading + description above its own card. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-medium text-ink">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      ) : null}
      <div className="card mt-3 p-6">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { user, updateSettings } = useAuth();
  const settings = user?.settings;

  const [draft, setDraft] = useState<UserSettings | null>(settings ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = useMemo(supportedTimezones, []);

  const current = draft ?? settings ?? null;

  function patch(partial: Partial<UserSettings>) {
    if (!current) return;
    setDraft({ ...current, ...partial });
    setSaved(false);
  }

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      await updateSettings(current);
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <Link
          to="/"
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          ← Back to board
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Settings</h1>

        {current ? (
          <div className="mt-8 flex flex-col gap-8">
            <Section
              title="Preferences"
              description="How your planner handles time and rollover."
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tz" className="text-sm font-medium text-ink">
                    Timezone
                  </label>
                  <select
                    id="tz"
                    className="input"
                    value={current.timezone}
                    onChange={(e) => patch({ timezone: e.target.value })}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-subtle">
                    Tasks roll over at your local midnight.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="weekStart" className="text-sm font-medium text-ink">
                    Week starts on
                  </label>
                  <select
                    id="weekStart"
                    className="input"
                    value={current.weekStartsOn}
                    onChange={(e) => patch({ weekStartsOn: Number(e.target.value) })}
                  >
                    {WEEKDAYS.map((day, i) => (
                      <option key={day} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-line pt-1">
                  <Toggle
                    label="Auto-roll incomplete tasks"
                    description="Move unfinished tasks to today at midnight."
                    checked={current.autoRollover}
                    onChange={(v) => patch({ autoRollover: v })}
                  />
                  <Toggle
                    label="Carry open subtasks forward"
                    description="When a task rolls, bring its unfinished subtasks along; completed ones stay as breadcrumbs."
                    checked={current.carryOpenSubtasks}
                    onChange={(v) => patch({ carryOpenSubtasks: v })}
                    disabled={!current.autoRollover}
                  />
                  <Toggle
                    label="Auto-roll incomplete objectives"
                    description="Move unfinished weekly objectives into the current week."
                    checked={current.autoRolloverObjectives}
                    onChange={(v) => patch({ autoRolloverObjectives: v })}
                  />
                </div>

                {error ? <p className="text-sm text-danger">{error}</p> : null}

                <div className="flex items-center gap-3 border-t border-line pt-4">
                  <Button onClick={handleSave} isLoading={saving}>
                    Save
                  </Button>
                  {saved ? <span className="text-sm text-success">Saved</span> : null}
                </div>
              </div>
            </Section>

            {/* Future sections (e.g. Account — change password) slot in here as
                additional <Section> blocks, each with its own card and action. */}
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-muted">Loading your settings…</p>
        )}
      </div>
    </AppShell>
  );
}
