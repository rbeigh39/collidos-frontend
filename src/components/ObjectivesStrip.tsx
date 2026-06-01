import { FormEvent, useState } from "react";
import { useObjectives } from "@/hooks/useObjectives";
import type { Channel } from "@/types";

interface ObjectivesStripProps {
  /** Any day in the focused week (objectives are weekly). */
  weekAnchor: string;
  channels: Channel[];
}

export function ObjectivesStrip({ weekAnchor, channels }: ObjectivesStripProps) {
  const {
    objectives,
    addObjective,
    editObjective,
    removeObjective,
    extendObjectiveWeek,
  } = useObjectives(weekAnchor);
  const [title, setTitle] = useState("");
  const [channelRef, setChannelRef] = useState("");
  const colorOf = (id?: string) => channels.find((c) => c.id === id)?.color;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await addObjective({ title: trimmed, channelRef: channelRef || undefined });
    setTitle("");
    setChannelRef("");
  }

  return (
    <div className="border-b border-line bg-canvas px-6 py-2.5">
      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink-subtle">
          Objectives this week
        </span>

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
            <span className={`text-sm ${o.completed ? "text-ink-subtle line-through" : "text-ink"}`}>
              {o.title}
            </span>
            <button
              onClick={() => void extendObjectiveWeek(o.id)}
              title="Extend to next week"
              className="text-ink-subtle opacity-0 hover:text-primary group-hover:opacity-100"
            >
              →
            </button>
            <button
              onClick={() => void removeObjective(o.id)}
              title="Delete objective"
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
