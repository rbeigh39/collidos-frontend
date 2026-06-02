import { useCallback } from "react";
import useSWR from "swr";
import {
  createObjective,
  deleteObjective,
  extendObjectiveWeek,
  listObjectives,
  updateObjective,
  type ObjectiveInput,
} from "@/api/objectives";
import type { Objective } from "@/types";

/** Objectives for the week containing `weekStart` (any day in that week). */
export function useObjectives(weekStart: string) {
  const { data, error, isLoading, mutate } = useSWR<Objective[]>(
    ["objectives", weekStart],
    () => listObjectives(weekStart),
    { revalidateOnFocus: false },
  );

  const add = useCallback(
    async (input: Omit<ObjectiveInput, "weekStart">) => {
      const created = await createObjective({ ...input, weekStart });
      await mutate();
      return created;
    },
    [mutate, weekStart],
  );

  const edit = useCallback(
    async (id: string, input: Partial<ObjectiveInput>) => {
      const updated = await updateObjective(id, input);
      await mutate();
      return updated;
    },
    [mutate],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteObjective(id);
      await mutate();
    },
    [mutate],
  );

  const extendWeek = useCallback(
    async (id: string) => {
      await extendObjectiveWeek(id);
      await mutate();
    },
    [mutate],
  );

  return {
    objectives: data ?? [],
    isLoading,
    error,
    addObjective: add,
    editObjective: edit,
    removeObjective: remove,
    extendObjectiveWeek: extendWeek,
  };
}
