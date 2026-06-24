import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createObjective,
  deleteObjective,
  listObjectives,
  moveObjectiveWeek,
  updateObjective,
  type ObjectiveInput,
} from "@/api/objectives";
import { qk } from "@/lib/queryKeys";
import { tempId } from "@/lib/ids";
import type { Objective } from "@/types";

/** Objectives for the week containing `weekStart` (any day in that week). */
export function useObjectives(weekStart: string) {
  const client = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: qk.objectives(weekStart),
    queryFn: () => listObjectives(weekStart),
  });

  // Moving an objective between weeks affects more than one cached week, so
  // refresh every cached objectives query rather than just this one.
  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: ["objectives"] });
  }, [client]);

  const key = qk.objectives(weekStart);
  // Snapshot + restore the viewed week's list around an optimistic change.
  const snapshotWeek = useCallback(async () => {
    await client.cancelQueries({ queryKey: key });
    return client.getQueryData<Objective[]>(key);
  }, [client, key]);
  const restoreWeek = useCallback(
    (previous: Objective[] | undefined) => {
      if (previous) client.setQueryData(key, previous);
    },
    [client, key],
  );

  const addMutation = useMutation({
    mutationFn: (input: Omit<ObjectiveInput, "weekStart">) =>
      createObjective({ ...input, weekStart }),
    onMutate: async (input: Omit<ObjectiveInput, "weekStart">) => {
      const previous = await snapshotWeek();
      const optimistic: Objective = {
        id: tempId(),
        title: input.title,
        weekStart,
        channelRef: input.channelRef ?? undefined,
        order: input.order ?? Number.MAX_SAFE_INTEGER,
        completed: input.completed ?? false,
        notes: input.notes,
      };
      client.setQueryData<Objective[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (_e, _v, ctx) => restoreWeek(ctx?.previous),
    onSettled: invalidate,
  });
  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ObjectiveInput> }) =>
      updateObjective(id, input),
    onSettled: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteObjective(id),
    onMutate: async (id: string) => {
      const previous = await snapshotWeek();
      client.setQueryData<Objective[]>(key, (old) =>
        (old ?? []).filter((o) => o.id !== id),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => restoreWeek(ctx?.previous),
    onSettled: invalidate,
  });
  const moveMutation = useMutation({
    mutationFn: ({ id, weeks }: { id: string; weeks: number }) =>
      moveObjectiveWeek(id, weeks),
    onSettled: invalidate,
  });

  const addObjective = useCallback(
    (input: Omit<ObjectiveInput, "weekStart">) => addMutation.mutateAsync(input),
    [addMutation],
  );
  const editObjective = useCallback(
    (id: string, input: Partial<ObjectiveInput>) =>
      editMutation.mutateAsync({ id, input }),
    [editMutation],
  );
  const removeObjective = useCallback(
    (id: string) => removeMutation.mutateAsync(id),
    [removeMutation],
  );
  const moveObjectiveWeekFn = useCallback(
    (id: string, weeks: number) => moveMutation.mutateAsync({ id, weeks }),
    [moveMutation],
  );

  return {
    objectives: (data ?? []) as Objective[],
    isLoading,
    error,
    addObjective,
    editObjective,
    removeObjective,
    moveObjectiveWeek: moveObjectiveWeekFn,
  };
}
