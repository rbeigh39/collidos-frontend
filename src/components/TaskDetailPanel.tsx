import { FormEvent, useEffect, useState } from "react";
import { SubtaskRow } from "@/components/SubtaskRow";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import type { Channel, Objective, Task } from "@/types";

export interface TaskEditInput {
  title?: string;
  notes?: string;
  timeEstimateMinutes?: number;
  channelRef?: string | null;
  objective?: string | null;
}

export interface TaskDetailHandlers {
  editTask: (id: string, input: TaskEditInput) => Promise<unknown>;
  addSubtask: (taskId: string, title: string) => Promise<unknown>;
  toggleSubtask: (taskId: string, subId: string, completed: boolean) => Promise<unknown>;
  renameSubtask: (taskId: string, subId: string, title: string) => Promise<unknown>;
  removeSubtask: (taskId: string, subId: string) => Promise<unknown>;
  startTimer?: (taskId: string) => Promise<unknown>;
  stopTimer?: (taskId: string) => Promise<unknown>;
}

interface TaskDetailPanelProps extends TaskDetailHandlers {
  task: Task | null;
  channels: Channel[];
  objectives: Objective[];
  onClose: () => void;
  onSendToBacklog?: (id: string) => void;
}

export function TaskDetailPanel({
  task,
  channels,
  objectives,
  onClose,
  onSendToBacklog,
  editTask,
  addSubtask,
  toggleSubtask,
  renameSubtask,
  removeSubtask,
  startTimer,
  stopTimer,
}: TaskDetailPanelProps) {
  // Local mirrors so typing is responsive; saves are debounced to the server.
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  // Reset local state whenever a different task is opened.
  useEffect(() => {
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setNewSubtask("");
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNotes = useDebouncedCallback((id: string, value: string) => {
    void editTask(id, { notes: value });
  }, 600);

  if (!task) return null;

  const isRunning = !!task.timerStartedAt;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (task?.timerStartedAt) {
      const start = new Date(task.timerStartedAt).getTime();
      const update = () => {
        setElapsed(Math.round((Date.now() - start) / 60000));
      };
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [task?.timerStartedAt]);

  const actualTime = (task?.actualTimeMinutes || 0) + elapsed;

  const done = task.subtasks.filter((s) => s.completed).length;

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task!.title) void editTask(task!.id, { title: trimmed });
    else setTitle(task!.title);
  }

  function handleAddSubtask(event: FormEvent) {
    event.preventDefault();
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    void addSubtask(task!.id, trimmed);
    setNewSubtask("");
  }

  return (
    <aside className="flex h-full w-full max-w-md shrink-0 flex-col border-l border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          Task details
        </span>
        <div className="flex items-center gap-3">
          {onSendToBacklog && task.plannedDate ? (
            <button
              onClick={() => onSendToBacklog(task.id)}
              className="text-xs text-ink-muted hover:text-primary"
            >
              Move to backlog
            </button>
          ) : null}
          <button onClick={onClose} aria-label="Close details" className="text-ink-subtle hover:text-ink">
            ✕
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full bg-transparent text-lg font-semibold text-ink outline-none"
          placeholder="Task title"
        />

        {task.rolloverCount > 0 ? (
          <p className="-mt-3 text-xs text-warning">
            Rolled over {task.rolloverCount} {task.rolloverCount === 1 ? "day" : "days"}
          </p>
        ) : null}

        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted">Channel</label>
            <select
              value={task.channelRef ?? ""}
              onChange={(e) => void editTask(task.id, { channelRef: e.target.value || null })}
              className="input py-1.5 text-sm"
            >
              <option value="">No channel</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted">Objective</label>
            <select
              value={task.objective ?? ""}
              onChange={(e) => void editTask(task.id, { objective: e.target.value || null })}
              className="input py-1.5 text-sm"
            >
              <option value="">No objective</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted">Estimate (min)</label>
            <input
              type="number"
              min="0"
              value={task.timeEstimateMinutes ?? ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                void editTask(task.id, { timeEstimateMinutes: val });
              }}
              className="input py-1.5 text-sm"
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted">Actual (min)</label>
            <div className="flex items-center gap-2 h-[34px]">
              <span className="text-sm font-medium text-ink w-8">{actualTime}m</span>
              {startTimer && stopTimer && (
                <button
                  onClick={() => isRunning ? stopTimer(task.id) : startTimer(task.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    isRunning 
                      ? "bg-warning/20 text-warning hover:bg-warning/30 animate-pulse" 
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {isRunning ? "Stop" : "Start"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">Subtasks</h3>
            <span className="text-xs text-ink-subtle">
              {done}/{task.subtasks.length} done
            </span>
          </div>
          <ul className="flex flex-col">
            {task.subtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                onToggle={(subId, completed) => void toggleSubtask(task.id, subId, completed)}
                onRename={(subId, value) => void renameSubtask(task.id, subId, value)}
                onDelete={(subId) => void removeSubtask(task.id, subId)}
              />
            ))}
          </ul>
          <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a subtask…"
              className="input"
            />
            <button
              type="submit"
              disabled={!newSubtask.trim()}
              className="btn-ghost shrink-0"
            >
              Add
            </button>
          </form>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-ink">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              saveNotes(task.id, e.target.value);
            }}
            onBlur={() => saveNotes.flush(task.id, notes)}
            rows={8}
            placeholder="Add notes, context, or a plan…"
            className="input resize-y"
          />
        </section>
      </div>
    </aside>
  );
}
