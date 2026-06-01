import { useCallback } from "react";
import useSWR from "swr";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type TaskInput,
  type TaskListParams,
} from "@/api/tasks";
import type { Task } from "@/types";

/**
 * SWR handles request deduplication, caching and revalidation for us, so many
 * components can read the same task list without firing duplicate requests.
 */
export function useTasks(params: TaskListParams = {}) {
  const key = ["tasks", params] as const;
  const { data, error, isLoading, mutate } = useSWR<Task[]>(key, () =>
    listTasks(params),
  );

  const addTask = useCallback(
    async (input: TaskInput) => {
      const created = await createTask(input);
      await mutate((current) => [...(current ?? []), created], {
        revalidate: false,
      });
      return created;
    },
    [mutate],
  );

  const editTask = useCallback(
    async (id: string, input: Partial<TaskInput>) => {
      const updated = await updateTask(id, input);
      await mutate(
        (current) => (current ?? []).map((t) => (t.id === id ? updated : t)),
        { revalidate: false },
      );
      return updated;
    },
    [mutate],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await mutate((current) => (current ?? []).filter((t) => t.id !== id), {
        revalidate: false,
      });
    },
    [mutate],
  );

  return {
    tasks: data ?? [],
    isLoading,
    error,
    addTask,
    editTask,
    removeTask,
  };
}
