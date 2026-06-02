import { memo, useEffect, useState } from "react";
import type { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskItemProps {
  task: Task;
  selected?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  settleTaskId?: string | null;
}

interface TaskCardProps extends TaskItemProps {
  isOverlay?: boolean;
  style?: React.CSSProperties;
  attributes?: any;
  listeners?: any;
  setNodeRef?: (node: HTMLElement | null) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  selected = false,
  onToggle,
  onDelete,
  onSelect,
  isOverlay = false,
  style,
  attributes,
  listeners,
  setNodeRef,
  settleTaskId,
}: TaskCardProps) {
  const isSettling = settleTaskId === task.id;
  const isDone = task.status === "done";
  const totalSubtasks = task.subtasks.length;
  const doneSubtasks = task.subtasks.filter((s) => s.completed).length;

  const isRunning = !!task.timerStartedAt;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (task?.timerStartedAt) {
      const start = new Date(task.timerStartedAt).getTime();
      const update = () => setElapsed(Math.round((Date.now() - start) / 60000));
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [task?.timerStartedAt]);

  const actualTime = (task.actualTimeMinutes || 0) + elapsed;

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, ...(isSettling ? { opacity: 0 } : {}) }}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task.id)}
      className={`group flex cursor-pointer items-center gap-3 rounded-control border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-primary/30 ${
        selected ? "border-primary" : "border-line"
      } ${isOverlay ? "cursor-grabbing shadow-lg ring-2 ring-primary ring-opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onToggle(task)}
        onPointerDown={(e) => e.stopPropagation()}
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
          {task.timeEstimateMinutes || actualTime > 0 || isRunning ? (
            <span className={`flex items-center gap-1 ${isRunning ? "text-warning font-medium animate-pulse" : ""}`}>
              · {task.timeEstimateMinutes || 0}m
              {(actualTime > 0 || isRunning) ? ` / ${actualTime}m` : ""}
            </span>
          ) : null}
          {totalSubtasks > 0 ? (
            <span>
              ☑ {doneSubtasks}/{totalSubtasks}
            </span>
          ) : null}
        </div>
      </div>

      <button
        onPointerDown={(e) => e.stopPropagation()}
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

// Memoized so toggling one task doesn't re-render the whole list.
export const TaskItem = memo(function TaskItem(props: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id, data: { type: "Task", task: props.task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <TaskCard
      {...props}
      style={style}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
    />
  );
});
