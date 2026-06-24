import { FormEvent, useState } from "react";
import { useObjectives } from "@/hooks/useObjectives";
import { shiftDate } from "@/lib/dates";
import type { Channel } from "@/types";

interface ObjectivesStripProps {
  /** The user's "today" as YYYY-MM-DD; the base for week navigation. */
  today: string;
  channels: Channel[];
}

/** Relative label for a week that is `offset` weeks from the current one. */
function weekLabel(offset: number): string {
  if (offset === 0) return "This week";
  if (offset === -1) return "Last week";
  if (offset === 1) return "Next week";
  if (offset < 0) return `${-offset} weeks ago`;
  return `in ${offset} weeks`;
}

export function ObjectivesStrip({ today, channels }: ObjectivesStripProps) {
  // 0 = current week; negative = past, positive = future.
  const [weekOffset, setWeekOffset] = useState(0);
  const weekAnchor = shiftDate(today, weekOffset * 7);

  const {
    objectives,
    addObjective,
    editObjective,
    removeObjective,
    moveObjectiveWeek,
  } = useObjectives(weekAnchor);

  const [title, setTitle] = useState("");
  const [channelRef, setChannelRef] = useState("");
  // Inline title editing.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const colorOf = (id?: string) => channels.find((c) => c.id === id)?.color;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await addObjective({ title: trimmed, channelRef: channelRef || undefined });
    setTitle("");
    setChannelRef("");
  }

  function startEdit(id: string, current: string) {
    setEditingId(id);
    setDraft(current);
  }

  async function commitEdit(id: string) {
    const trimmed = draft.trim();
    const original = objectives.find((o) => o.id === id)?.title;
    setEditingId(null);
    if (trimmed && trimmed !== original) {
      await editObjective(id, { title: trimmed });
    }
  }

  return (
    <div className="border-b border-line bg-canvas px-6 py-2.5">
      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink-subtle">
          Objectives
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
            className="text-ink-subtle hover:text-ink"
          >
            ←
          </button>
          <span className="min-w-[5.5rem] text-center text-xs font-medium text-ink-muted">
            {weekLabel(weekOffset)}
          </span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
            className="text-ink-subtle hover:text-ink"
          >
            →
          </button>
        </div>

        {objectives.map((o) => (
          <div
            key={o.id}
            className="group flex shrink-0 items-center gap-2 rounded-control border border-line bg-surface px-2.5 py-1"
          >
            <input
              type="checkbox"
              checked={o.completed}
              onChange={() => void editObjective(o.id, { completed: !o.completed })}
              aria-label="Toggle objective complete"
              className="h-3.5 w-3.5 cursor-pointer accent-primary"
            />
            {colorOf(o.channelRef) ? (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colorOf(o.channelRef) }}
              />
            ) : null}
            {editingId === o.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => void commitEdit(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void commitEdit(o.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                aria-label="Edit objective title"
                className="rounded-control border border-line bg-surface px-1.5 py-0.5 text-sm text-ink focus:border-primary"
              />
            ) : (
              <button
                onClick={() => startEdit(o.id, o.title)}
                title="Click to rename"
                className={`text-left text-sm ${o.completed ? "text-ink-subtle line-through" : "text-ink"}`}
              >
                {o.title}
              </button>
            )}
            <button
              onClick={() => void moveObjectiveWeek(o.id, -1)}
              title="Move to previous week"
              aria-label="Move to previous week"
              className="text-ink-subtle opacity-0 hover:text-primary group-hover:opacity-100"
            >
              ←
            </button>
            <button
              onClick={() => void moveObjectiveWeek(o.id, 1)}
              title="Move to next week"
              aria-label="Move to next week"
              className="text-ink-subtle opacity-0 hover:text-primary group-hover:opacity-100"
            >
              →
            </button>
            <button
              onClick={() => void removeObjective(o.id)}
              title="Delete objective"
              aria-label="Delete objective"
              className="text-ink-subtle opacity-0 hover:text-danger group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}

        <form onSubmit={handleAdd} className="flex shrink-0 items-center gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="+ Add objective"
            className="rounded-control border border-transparent bg-transparent px-2 py-1 text-sm text-ink placeholder:text-ink-subtle hover:border-line focus:border-primary focus:bg-surface"
          />
          {channels.length > 0 ? (
            <select
              value={channelRef}
              onChange={(e) => setChannelRef(e.target.value)}
              className="rounded-control border border-line bg-surface px-1.5 py-1 text-xs text-ink-muted"
            >
              <option value="">No channel</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
        </form>
      </div>
    </div>
  );
}
