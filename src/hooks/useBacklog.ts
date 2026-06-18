import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBacklog } from "@/api/backlog";
import { createTask, deleteTask, updateTask } from "@/api/tasks";
import { qk } from "@/lib/queryKeys";
import type { BacklogBucket, BacklogGroup } from "@/types";

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

  const addMutation = useMutation({
    mutationFn: ({ bucket, title }: { bucket: BacklogBucket; title: string }) =>
      createTask({ title, backlogBucket: bucket }),
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
