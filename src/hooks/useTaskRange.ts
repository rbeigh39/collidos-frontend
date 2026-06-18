import { useCallback, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  addSubtask as addSubtaskApi,
  createTask,
  deleteSubtask as deleteSubtaskApi,
  deleteTask,
  reorderSubtasks as reorderSubtasksApi,
  updateSubtask as updateSubtaskApi,
  updateTask,
  startTimer as startTimerApi,
  stopTimer as stopTimerApi,
  reorderTasks as reorderTasksApi,
  type TaskInput,
} from "@/api/tasks";
import { fetchRange } from "@/api/range";
import { useAuth } from "@/hooks/useAuth";
import { qk } from "@/lib/queryKeys";
import { shiftDate, todayString } from "@/lib/dates";
import type { RangeResponse, Task, TaskAppearance } from "@/types";

const DAYS_BEFORE = 5;
const DAYS_AFTER = 9; // 5 + 9 + today = 15 days initially
const PAGE = 7;

// ─── Optimistic cache helpers ──────────────────────────────────────────────
// Pure transforms over a RangeResponse. Each returns a new object (structural
// sharing only where unchanged) so React sees fresh references on the buckets
// it must re-render. They're best-effort previews — the `onSettled`
// invalidation always reconciles against the server's authoritative bucketing.

/** Patch a task's fields wherever it appears across every day bucket. */
function patchTask(
  data: RangeResponse,
  taskId: string,
  patch: (task: Task) => Task,
): RangeResponse {
  const mapBucket = (bucket: TaskAppearance[]) =>
    bucket.map((a) =>
      a.task.id === taskId ? { ...a, task: patch(a.task) } : a,
    );
  return {
    ...data,
    days: data.days.map((day) => ({
      ...day,
      live: mapBucket(day.live),
      completed: mapBucket(day.completed),
      breadcrumbs: mapBucket(day.breadcrumbs),
    })),
  };
}

/** Reorder a single day's `live` bucket to match `orderedIds`. */
function reorderLive(data: RangeResponse, orderedIds: string[]): RangeResponse {
  const idSet = new Set(orderedIds);
  return {
    ...data,
    days: data.days.map((day) => {
      if (!day.live.some((a) => idSet.has(a.task.id))) return day;
      const byId = new Map(day.live.map((a) => [a.task.id, a]));
      const live = orderedIds
        .map((id) => byId.get(id))
        .filter((a): a is TaskAppearance => Boolean(a));
      return { ...day, live };
    }),
  };
}

/**
 * Move a task to `targetDate`, optionally reordering the target day's `live`
 * bucket to `orderedIds`. The trickiest optimistic write: remove the task from
 * its source day's buckets (and any stale breadcrumbs), then insert it into the
 * target day. If the target day isn't in this window the task drops out until
 * the settle refetch — acceptable, since drag targets are always visible.
 */
function moveTaskToDay(
  data: RangeResponse,
  taskId: string,
  targetDate: string,
  orderedIds?: string[],
): RangeResponse {
  let moved: TaskAppearance | undefined;
  const without = data.days.map((day) => {
    const found =
      day.live.find((a) => a.task.id === taskId) ??
      day.completed.find((a) => a.task.id === taskId);
    if (found && !moved) moved = found;
    return {
      ...day,
      live: day.live.filter((a) => a.task.id !== taskId),
      completed: day.completed.filter((a) => a.task.id !== taskId),
      breadcrumbs: day.breadcrumbs.filter((a) => a.task.id !== taskId),
    };
  });
  if (!moved) return data; // task isn't in this window

  const movedAppearance: TaskAppearance = {
    ...moved,
    task: { ...moved.task, plannedDate: targetDate },
    liveDate: undefined,
  };

  return {
    ...data,
    days: without.map((day) => {
      if (day.date !== targetDate) return day;
      let live = [...day.live, movedAppearance];
      if (orderedIds) {
        const byId = new Map(live.map((a) => [a.task.id, a]));
        live = orderedIds
          .map((id) => byId.get(id))
          .filter((a): a is TaskAppearance => Boolean(a));
      }
      return { ...day, live };
    }),
  };
}

/**
 * The reusable optimistic-mutation shape every E1–E12 feature copies:
 *   onMutate  → cancel in-flight range fetches, snapshot every range window,
 *               apply the optimistic transform across all of them.
 *   onError   → restore the snapshots.
 *   onSettled → invalidate `rangeRoot` so the server reconciles every window.
 * `optimistic` is optional — list-membership changes (add/remove) skip the
 * preview and rely on the settle refetch, which is fast and always correct.
 */
type RangeSnapshots = ReturnType<QueryClient["getQueriesData"]>;
interface RangeMutationContext {
  snapshots: RangeSnapshots;
}

function makeRangeMutation<TVars>(
  client: QueryClient,
  mutationFn: (vars: TVars) => Promise<unknown>,
  optimistic?: (data: RangeResponse, vars: TVars) => RangeResponse,
) {
  return {
    mutationFn,
    onMutate: async (vars: TVars): Promise<RangeMutationContext> => {
      if (!optimistic) return { snapshots: [] };
      await client.cancelQueries({ queryKey: qk.rangeRoot });
      const snapshots = client.getQueriesData<RangeResponse>({
        queryKey: qk.rangeRoot,
      });
      client.setQueriesData<RangeResponse>({ queryKey: qk.rangeRoot }, (old) =>
        old ? optimistic(old, vars) : old,
      );
      return { snapshots };
    },
    onError: (_err: unknown, _vars: TVars, ctx: RangeMutationContext | undefined) => {
      ctx?.snapshots.forEach(([key, data]) => client.setQueryData(key, data));
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: qk.rangeRoot });
    },
  };
}

/**
 * Drives the vertical multi-day view. Keeps a [from, to] window of calendar
 * days and grows it as the user scrolls. TanStack Query dedups/caches per
 * window; mutations write optimistically to the affected day bucket(s) and
 * invalidate the range root on settle so every cached window stays correct.
 */
export function useTaskRange(channelIds: string[] = []) {
  const { user } = useAuth();
  const tz = user?.settings.timezone ?? "UTC";
  const today = todayString(tz);
  const channelCsv = channelIds.join(",");
  const client = useQueryClient();

  const [from, setFrom] = useState(() => shiftDate(today, -DAYS_BEFORE));
  const [to, setTo] = useState(() => shiftDate(today, DAYS_AFTER));

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: qk.range(from, to, channelCsv),
    queryFn: () => fetchRange(from, to, channelCsv || undefined),
    // Keep the prior window visible while a grown window loads, so
    // infinite-scroll prepend/append never flashes empty.
    placeholderData: keepPreviousData,
  });

  const loadEarlier = useCallback(() => setFrom((f) => shiftDate(f, -PAGE)), []);
  const loadLater = useCallback(() => setTo((t) => shiftDate(t, PAGE)), []);

  // ─── Mutations ────────────────────────────────────────────────────────────
  // Field updates patch the task in place (snappy); moves/reorders rewrite the
  // affected day buckets (the reference optimistic write); add/remove rely on
  // the settle refetch. All invalidate `rangeRoot` on settle.

  const addMutation = useMutation(
    makeRangeMutation(client, ({ date, title }: { date: string; title: string }) => {
      const input: TaskInput = { title, status: "planned", plannedDate: date };
      return createTask(input);
    }),
  );

  const toggleDoneMutation = useMutation(
    makeRangeMutation(
      client,
      (task: Task) =>
        updateTask(task.id, { status: task.status === "done" ? "planned" : "done" }),
      (data, task) =>
        patchTask(data, task.id, (t) => ({
          ...t,
          status: t.status === "done" ? "planned" : "done",
        })),
    ),
  );

  const editMutation = useMutation(
    makeRangeMutation(
      client,
      ({ id, input }: { id: string; input: Partial<TaskInput> }) =>
        updateTask(id, input),
    ),
  );

  const moveMutation = useMutation(
    makeRangeMutation(
      client,
      ({ id, date, order }: { id: string; date: string | null; order?: number }) =>
        updateTask(id, { plannedDate: date, order }),
      (data, { id, date }) => (date ? moveTaskToDay(data, id, date) : data),
    ),
  );

  const moveAndReorderMutation = useMutation(
    makeRangeMutation(
      client,
      async ({
        id,
        date,
        orderedIds,
      }: {
        id: string;
        date: string;
        orderedIds: string[];
      }) => {
        await updateTask(id, { plannedDate: date });
        await reorderTasksApi(orderedIds);
      },
      (data, { id, date, orderedIds }) => moveTaskToDay(data, id, date, orderedIds),
    ),
  );

  const reorderMutation = useMutation(
    makeRangeMutation(
      client,
      (orderedIds: string[]) => reorderTasksApi(orderedIds),
      (data, orderedIds) => reorderLive(data, orderedIds),
    ),
  );

  const removeMutation = useMutation(
    makeRangeMutation(client, (id: string) => deleteTask(id)),
  );

  const addSubtaskMutation = useMutation(
    makeRangeMutation(client, ({ taskId, title }: { taskId: string; title: string }) =>
      addSubtaskApi(taskId, title),
    ),
  );

  const toggleSubtaskMutation = useMutation(
    makeRangeMutation(
      client,
      ({ taskId, subId, completed }: { taskId: string; subId: string; completed: boolean }) =>
        updateSubtaskApi(taskId, subId, { completed }),
      (data, { taskId, subId, completed }) =>
        patchTask(data, taskId, (t) => ({
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subId ? { ...s, completed } : s,
          ),
        })),
    ),
  );

  const renameSubtaskMutation = useMutation(
    makeRangeMutation(
      client,
      ({ taskId, subId, title }: { taskId: string; subId: string; title: string }) =>
        updateSubtaskApi(taskId, subId, { title }),
      (data, { taskId, subId, title }) =>
        patchTask(data, taskId, (t) => ({
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, title } : s)),
        })),
    ),
  );

  const removeSubtaskMutation = useMutation(
    makeRangeMutation(client, ({ taskId, subId }: { taskId: string; subId: string }) =>
      deleteSubtaskApi(taskId, subId),
    ),
  );

  const reorderSubtasksMutation = useMutation(
    makeRangeMutation(
      client,
      ({ taskId, orderedIds }: { taskId: string; orderedIds: string[] }) =>
        reorderSubtasksApi(taskId, orderedIds),
    ),
  );

  const startTimerMutation = useMutation(
    makeRangeMutation(client, (taskId: string) => startTimerApi(taskId)),
  );

  const stopTimerMutation = useMutation(
    makeRangeMutation(client, (taskId: string) => stopTimerApi(taskId)),
  );

  // ─── Stable callbacks preserving the prior hook's public API ───────────────
  const addTask = useCallback(
    (date: string, title: string) => addMutation.mutateAsync({ date, title }),
    [addMutation],
  );
  const toggleTaskDone = useCallback(
    (task: Task) => toggleDoneMutation.mutateAsync(task),
    [toggleDoneMutation],
  );
  const editTask = useCallback(
    (id: string, input: Partial<TaskInput>) => editMutation.mutateAsync({ id, input }),
    [editMutation],
  );
  const moveTask = useCallback(
    (id: string, date: string | null, order?: number) =>
      moveMutation.mutateAsync({ id, date, order }),
    [moveMutation],
  );
  const moveAndReorder = useCallback(
    (id: string, date: string, orderedIds: string[]) =>
      moveAndReorderMutation.mutateAsync({ id, date, orderedIds }),
    [moveAndReorderMutation],
  );
  const reorderTasks = useCallback(
    (orderedIds: string[]) => reorderMutation.mutateAsync(orderedIds),
    [reorderMutation],
  );
  const removeTask = useCallback(
    (id: string) => removeMutation.mutateAsync(id),
    [removeMutation],
  );
  const addSubtask = useCallback(
    (taskId: string, title: string) => addSubtaskMutation.mutateAsync({ taskId, title }),
    [addSubtaskMutation],
  );
  const toggleSubtask = useCallback(
    (taskId: string, subId: string, completed: boolean) =>
      toggleSubtaskMutation.mutateAsync({ taskId, subId, completed }),
    [toggleSubtaskMutation],
  );
  const renameSubtask = useCallback(
    (taskId: string, subId: string, title: string) =>
      renameSubtaskMutation.mutateAsync({ taskId, subId, title }),
    [renameSubtaskMutation],
  );
  const removeSubtask = useCallback(
    (taskId: string, subId: string) =>
      removeSubtaskMutation.mutateAsync({ taskId, subId }),
    [removeSubtaskMutation],
  );
  const reorderSubtasks = useCallback(
    (taskId: string, orderedIds: string[]) =>
      reorderSubtasksMutation.mutateAsync({ taskId, orderedIds }),
    [reorderSubtasksMutation],
  );
  const startTimer = useCallback(
    (taskId: string) => startTimerMutation.mutateAsync(taskId),
    [startTimerMutation],
  );
  const stopTimer = useCallback(
    (taskId: string) => stopTimerMutation.mutateAsync(taskId),
    [stopTimerMutation],
  );

  return {
    days: data?.days ?? [],
    timezone: data?.timezone ?? tz,
    today,
    isLoading,
    isValidating: isFetching,
    error,
    loadEarlier,
    loadLater,
    addTask,
    toggleTaskDone,
    editTask,
    moveTask,
    moveAndReorder,
    removeTask,
    addSubtask,
    toggleSubtask,
    renameSubtask,
    removeSubtask,
    reorderSubtasks,
    startTimer,
    stopTimer,
    reorderTasks,
  };
}
