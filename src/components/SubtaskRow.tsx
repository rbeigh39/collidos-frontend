import { memo, useState } from "react";
import type { Subtask } from "@/types";

interface SubtaskRowProps {
  subtask: Subtask;
  /** When true, this subtask was completed on the day currently being viewed. */
  highlighted?: boolean;
  onToggle: (subId: string, completed: boolean) => void;
  onRename: (subId: string, title: string) => void;
  onDelete: (subId: string) => void;
}

export const SubtaskRow = memo(function SubtaskRow({
  subtask,
  highlighted = false,
  onToggle,
  onRename,
  onDelete,
}: SubtaskRowProps) {
  const [title, setTitle] = useState(subtask.title);

  function commitRename() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== subtask.title) {
      onRename(subtask.id, trimmed);
    } else {
      setTitle(subtask.title);
    }
  }

  return (
    <li
      className={`group flex items-center gap-2 rounded-control px-2 py-1.5 transition-colors ${
        highlighted ? "bg-primary-soft" : "hover:bg-canvas"
      }`}
    >
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={() => onToggle(subtask.id, !subtask.completed)}
        aria-label={subtask.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
        className="h-3.5 w-3.5 cursor-pointer accent-primary"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={`flex-1 bg-transparent text-sm outline-none ${
          subtask.completed ? "text-ink-subtle line-through" : "text-ink"
        }`}
      />
      <button
        onClick={() => onDelete(subtask.id)}
        aria-label="Delete subtask"
        className="text-ink-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
});
