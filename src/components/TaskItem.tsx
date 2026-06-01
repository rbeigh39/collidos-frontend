import { memo } from "react";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

// Memoized so toggling one task doesn't re-render the whole list.
export const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onDelete,
}: TaskItemProps) {
  const isDone = task.status === "done";

  return (
    <li className="group flex items-center gap-3 rounded-control border border-line bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-primary/30">
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onToggle(task)}
        aria-label={isDone ? "Mark task incomplete" : "Mark task complete"}
        className="h-4 w-4 cursor-pointer accent-primary"
      />

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isDone ? "text-ink-subtle line-through" : "text-ink"}`}>
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-subtle">
          {task.channel ? <span>{task.channel}</span> : null}
          {task.timeEstimateMinutes ? <span>· {task.timeEstimateMinutes}m</span> : null}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="text-ink-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
});
