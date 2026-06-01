import { memo } from "react";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  selected?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

// Memoized so toggling one task doesn't re-render the whole list.
export const TaskItem = memo(function TaskItem({
  task,
  selected = false,
  onToggle,
  onDelete,
  onSelect,
}: TaskItemProps) {
  const isDone = task.status === "done";
  const totalSubtasks = task.subtasks.length;
  const doneSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <li
      onClick={() => onSelect(task.id)}
      className={`group flex cursor-pointer items-center gap-3 rounded-control border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-primary/30 ${
        selected ? "border-primary" : "border-line"
      }`}
    >
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onToggle(task)}
        onClick={(e) => e.stopPropagation()}
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
          {totalSubtasks > 0 ? (
            <span>
              ☑ {doneSubtasks}/{totalSubtasks}
            </span>
          ) : null}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        aria-label="Delete task"
        className="text-ink-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
});
