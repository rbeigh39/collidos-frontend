import { FormEvent, useCallback, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TaskItem } from "@/components/TaskItem";
import { Button } from "@/components/ui/Button";
import { useTasks } from "@/hooks/useTasks";
import { getErrorMessage } from "@/lib/getErrorMessage";
import type { Task } from "@/types";

// Today's date label, computed once per render (cheap, derived during render).
function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function DashboardPage() {
  const { tasks, isLoading, error, addTask, editTask, removeTask } = useTasks();
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const remaining = tasks.filter((t) => t.status !== "done").length;

  const handleAdd = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const trimmed = title.trim();
      if (!trimmed) return;
      setFormError(null);
      try {
        await addTask({ title: trimmed, status: "planned" });
        setTitle("");
      } catch (err) {
        setFormError(getErrorMessage(err, "Could not add task"));
      }
    },
    [title, addTask],
  );

  const handleToggle = useCallback(
    (task: Task) => {
      void editTask(task.id, {
        status: task.status === "done" ? "planned" : "done",
      });
    },
    [editTask],
  );

  const handleDelete = useCallback(
    (id: string) => {
      void removeTask(id);
    },
    [removeTask],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-6">
          <p className="text-sm text-ink-muted">{formatToday()}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Today</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {remaining} {remaining === 1 ? "task" : "tasks"} to focus on
          </p>
        </header>

        <form onSubmit={handleAdd} className="mb-5 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task for today…"
            className="input"
          />
          <Button type="submit" disabled={!title.trim()}>
            Add
          </Button>
        </form>

        {formError ? <p className="mb-3 text-sm text-danger">{formError}</p> : null}

        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading tasks…</p>
        ) : error ? (
          <p className="text-sm text-danger">{getErrorMessage(error)}</p>
        ) : tasks.length === 0 ? (
          <div className="card flex flex-col items-center gap-1 px-6 py-12 text-center">
            <p className="text-base font-medium text-ink">A clean slate</p>
            <p className="text-sm text-ink-muted">
              Add your first task to start planning your day.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
