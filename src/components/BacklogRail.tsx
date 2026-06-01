import { FormEvent, useState } from "react";
import { useBacklog } from "@/hooks/useBacklog";
import type { BacklogBucket } from "@/types";

const BUCKET_LABELS: Record<BacklogBucket, string> = {
  next_two_weeks: "Next two weeks",
  next_month: "Next month",
  next_quarter: "Next quarter",
  next_year: "Next year",
  someday: "Someday",
  never: "Never",
};

interface BacklogRailProps {
  today: string;
  onClose: () => void;
}

export function BacklogRail({ today, onClose }: BacklogRailProps) {
  const { buckets, addToBacklog, scheduleTask, removeTask } = useBacklog();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function handleAdd(bucket: BacklogBucket) {
    return (event: FormEvent) => {
      event.preventDefault();
      const title = (drafts[bucket] ?? "").trim();
      if (!title) return;
      void addToBacklog(bucket, title);
      setDrafts((d) => ({ ...d, [bucket]: "" }));
    };
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-sm font-semibold text-ink">Backlog</span>
        <button onClick={onClose} aria-label="Close backlog" className="text-ink-subtle hover:text-ink">
          ✕
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {buckets.map((group) => (
          <section key={group.bucket}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {BUCKET_LABELS[group.bucket]}
              </h3>
              {group.tasks.length > 0 ? (
                <span className="text-xs text-ink-subtle">{group.tasks.length}</span>
              ) : null}
            </div>

            <ul className="flex flex-col gap-1.5">
              {group.tasks.map((task) => (
                <li
                  key={task.id}
                  className="group rounded-control border border-line px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink">{task.title}</span>
                    <button
                      onClick={() => void removeTask(task.id)}
                      aria-label="Delete task"
                      className="text-ink-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                  {task.backlogFolder ? (
                    <span className="text-xs text-ink-subtle">{task.backlogFolder}</span>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      onClick={() => void scheduleTask(task.id, today)}
                      className="rounded-control bg-primary-soft px-2 py-0.5 text-xs text-primary hover:bg-primary-soft/70"
                    >
                      Schedule today
                    </button>
                    <input
                      type="date"
                      aria-label="Schedule on date"
                      onChange={(e) => e.target.value && void scheduleTask(task.id, e.target.value)}
                      className="rounded-control border border-line bg-surface px-1.5 py-0.5 text-xs text-ink-muted"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAdd(group.bucket)} className="mt-1.5">
              <input
                value={drafts[group.bucket] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [group.bucket]: e.target.value }))}
                placeholder="+ Add to backlog"
                className="w-full rounded-control border border-transparent bg-transparent px-2 py-1 text-sm text-ink placeholder:text-ink-subtle hover:border-line focus:border-primary focus:bg-surface"
              />
            </form>
          </section>
        ))}
      </div>
    </aside>
  );
}
