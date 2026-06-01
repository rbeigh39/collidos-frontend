import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetchBacklog } from "@/api/backlog";
import { createTask, deleteTask, updateTask } from "@/api/tasks";
import type { BacklogBucket, BacklogGroup } from "@/types";

export function useBacklog() {
  const { data, error, isLoading, mutate } = useSWR<BacklogGroup[]>(
    "backlog",
    fetchBacklog,
  );
  const { mutate: globalMutate } = useSWRConfig();

  // Scheduling moves a task between the backlog and the day range; refresh both.
  const revalidateRange = useCallback(
    () => globalMutate((key) => Array.isArray(key) && key[0] === "range"),
    [globalMutate],
  );

  const addToBacklog = useCallback(
    async (bucket: BacklogBucket, title: string) => {
      await createTask({ title, backlogBucket: bucket });
      await mutate();
    },
    [mutate],
  );

  const scheduleTask = useCallback(
    async (id: string, date: string) => {
      await updateTask(id, { plannedDate: date });
      await Promise.all([mutate(), revalidateRange()]);
    },
    [mutate, revalidateRange],
  );

  const moveBucket = useCallback(
    async (id: string, bucket: BacklogBucket) => {
      await updateTask(id, { backlogBucket: bucket });
      await mutate();
    },
    [mutate],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await mutate();
    },
    [mutate],
  );

  return {
    buckets: data ?? [],
    isLoading,
    error,
    addToBacklog,
    scheduleTask,
    moveBucket,
    removeTask,
  };
}
