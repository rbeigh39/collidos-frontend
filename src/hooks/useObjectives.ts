import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createObjective,
  deleteObjective,
  extendObjectiveWeek,
  listObjectives,
  updateObjective,
  type ObjectiveInput,
} from "@/api/objectives";
import { qk } from "@/lib/queryKeys";
import type { Objective } from "@/types";

/** Objectives for the week containing `weekStart` (any day in that week). */
export function useObjectives(weekStart: string) {
  const client = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: qk.objectives(weekStart),
    queryFn: () => listObjectives(weekStart),
  });

  // extend-week can move an objective into an adjacent week, so refresh every
  // cached objectives query rather than just this one.
  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: ["objectives"] });
  }, [client]);

  const addMutation = useMutation({
    mutationFn: (input: Omit<ObjectiveInput, "weekStart">) =>
      createObjective({ ...input, weekStart }),
    onSettled: invalidate,
  });
  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ObjectiveInput> }) =>
      updateObjective(id, input),
    onSettled: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteObjective(id),
    onSettled: invalidate,
  });
  const extendMutation = useMutation({
    mutationFn: (id: string) => extendObjectiveWeek(id),
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
  const extendObjectiveWeekFn = useCallback(
    (id: string) => extendMutation.mutateAsync(id),
    [extendMutation],
  );

  return {
    objectives: (data ?? []) as Objective[],
    isLoading,
    error,
    addObjective,
    editObjective,
    removeObjective,
    extendObjectiveWeek: extendObjectiveWeekFn,
  };
}
