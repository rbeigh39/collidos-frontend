import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { user, updateSettings } = useAuth();
  const settings = user?.settings;

  const [draft, setDraft] = useState<UserSettings | null>(settings ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = useMemo(supportedTimezones, []);

  // Sync the draft when the modal opens with fresh settings.
  const current = draft ?? settings ?? null;
  if (!current) return null;

  function patch(partial: Partial<UserSettings>) {
    setDraft({ ...current!, ...partial });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateSettings(current!);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
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
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
