import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBacklog } from "@/api/backlog";
import { createTask, deleteTask, updateTask } from "@/api/tasks";
import { qk } from "@/lib/queryKeys";
import { tempId } from "@/lib/ids";
import type { BacklogBucket, BacklogGroup, Task } from "@/types";

export function useBacklog() {
  const client = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: qk.backlog,
    queryFn: fetchBacklog,
  });

  const invalidateBacklog = useCallback(
    () => client.invalidateQueries({ queryKey: qk.backlog }),
    [client],
  );
  // Scheduling moves a task between the backlog and the day range, so refresh
  // both the backlog list and every range window.
  const invalidateBoth = useCallback(() => {
    void client.invalidateQueries({ queryKey: qk.backlog });
    void client.invalidateQueries({ queryKey: qk.rangeRoot });
  }, [client]);

  // Snapshot + restore the backlog list around an optimistic change.
  const snapshotBacklog = useCallback(async () => {
    await client.cancelQueries({ queryKey: qk.backlog });
    return client.getQueryData<BacklogGroup[]>(qk.backlog);
  }, [client]);
  const restoreBacklog = useCallback(
    (previous: BacklogGroup[] | undefined) => {
      if (previous) client.setQueryData(qk.backlog, previous);
    },
    [client],
  );

  const addMutation = useMutation({
    mutationFn: ({ bucket, title }: { bucket: BacklogBucket; title: string }) =>
      createTask({ title, backlogBucket: bucket }),
    onMutate: async ({ bucket, title }: { bucket: BacklogBucket; title: string }) => {
      const previous = await snapshotBacklog();
      const now = new Date().toISOString();
      const optimistic: Task = {
        id: tempId(),
        title,
        status: "backlog",
        subtasks: [],
        backlogBucket: bucket,
        order: Number.MAX_SAFE_INTEGER,
        rolloverCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      client.setQueryData<BacklogGroup[]>(qk.backlog, (old) => {
        const groups = old ?? [];
        if (groups.some((g) => g.bucket === bucket)) {
          return groups.map((g) =>
            g.bucket === bucket ? { ...g, tasks: [...g.tasks, optimistic] } : g,
          );
        }
        return [...groups, { bucket, tasks: [optimistic] }];
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => restoreBacklog(ctx?.previous),
    onSettled: invalidateBacklog,
  });
  const scheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      updateTask(id, { plannedDate: date }),
    onSettled: invalidateBoth,
  });
  const moveBucketMutation = useMutation({
    mutationFn: ({ id, bucket }: { id: string; bucket: BacklogBucket }) =>
      updateTask(id, { backlogBucket: bucket }),
    onSettled: invalidateBacklog,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id: string) => {
      const previous = await snapshotBacklog();
      client.setQueryData<BacklogGroup[]>(qk.backlog, (old) =>
        (old ?? []).map((g) => ({ ...g, tasks: g.tasks.filter((t) => t.id !== id) })),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => restoreBacklog(ctx?.previous),
    onSettled: invalidateBacklog,
  });

  const addToBacklog = useCallback(
    (bucket: BacklogBucket, title: string) =>
      addMutation.mutateAsync({ bucket, title }),
    [addMutation],
  );
  const scheduleTask = useCallback(
    (id: string, date: string) => scheduleMutation.mutateAsync({ id, date }),
    [scheduleMutation],
  );
  const moveBucket = useCallback(
    (id: string, bucket: BacklogBucket) =>
      moveBucketMutation.mutateAsync({ id, bucket }),
    [moveBucketMutation],
  );
  const removeTask = useCallback(
    (id: string) => removeMutation.mutateAsync(id),
    [removeMutation],
  );

  return {
    buckets: (data ?? []) as BacklogGroup[],
    isLoading,
    error,
    addToBacklog,
    scheduleTask,
    moveBucket,
    removeTask,
  };
}
