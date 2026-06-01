import { memo } from "react";
import { relativeLabel, shortDate } from "@/lib/dates";
import type { TaskAppearance } from "@/types";

interface BreadcrumbItemProps {
  appearance: TaskAppearance;
  todayStr: string;
  onSelect: (id: string) => void;
  /** Jump the view to the day this task lives on. */
  onGoToLiveDate?: (date: string) => void;
}

/**
 * A muted "breadcrumb" of a task that lives on another day, shown here because
 * some of its subtasks were completed (or left behind) on this day.
 */
export const BreadcrumbItem = memo(function BreadcrumbItem({
  appearance,
  todayStr,
  onSelect,
  onGoToLiveDate,
}: BreadcrumbItemProps) {
  const { task, completedSubtaskIdsOnThisDay, leftBehindSubtaskIdsOnThisDay, liveDate } =
    appearance;
  const byId = new Map(task.subtasks.map((s) => [s.id, s]));
  const completed = completedSubtaskIdsOnThisDay.map((id) => byId.get(id)).filter(Boolean);
  const leftBehind = leftBehindSubtaskIdsOnThisDay.map((id) => byId.get(id)).filter(Boolean);

  return (
    <li
      onClick={() => onSelect(task.id)}
      className="cursor-pointer rounded-control border border-dashed border-line bg-canvas/60 px-3 py-2 transition-colors hover:border-primary/30"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-ink-muted">{task.title}</span>
        {liveDate ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGoToLiveDate?.(liveDate);
            }}
            className="shrink-0 text-xs text-primary hover:underline"
          >
            lives {relativeLabel(liveDate, todayStr)} ({shortDate(liveDate)})
          </button>
        ) : null}
      </div>

      <ul className="mt-1 space-y-0.5">
        {completed.map((s) => (
          <li key={s!.id} className="flex items-center gap-2 text-xs text-ink-subtle">
            <span className="text-success">✓</span>
            <span className="line-through">{s!.title}</span>
          </li>
        ))}
        {leftBehind.map((s) => (
          <li key={s!.id} className="flex items-center gap-2 text-xs text-ink-subtle">
            <span>○</span>
            <span>{s!.title}</span>
            <span className="text-ink-subtle/70">(left here)</span>
          </li>
        ))}
      </ul>
    </li>
  );
});
