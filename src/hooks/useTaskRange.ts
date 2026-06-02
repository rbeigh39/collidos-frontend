import { useCallback, useState } from "react";
import useSWR from "swr";
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
import { shiftDate, todayString } from "@/lib/dates";
import type { RangeResponse, Task } from "@/types";

const DAYS_BEFORE = 5;
const DAYS_AFTER = 9; // 5 + 9 + today = 15 days initially
const PAGE = 7;

/**
 * Drives the vertical multi-day view. Keeps a [from, to] window of calendar
 * days and grows it as the user scrolls. SWR dedups/caches per window; all
 * mutations revalidate the window so day buckets stay correct.
 */
export function useTaskRange(channelIds: string[] = []) {
  const { user } = useAuth();
  const tz = user?.settings.timezone ?? "UTC";
  const today = todayString(tz);
  const channelCsv = channelIds.join(",");

  const [from, setFrom] = useState(() => shiftDate(today, -DAYS_BEFORE));
  const [to, setTo] = useState(() => shiftDate(today, DAYS_AFTER));

  const { data, error, isLoading, isValidating, mutate } = useSWR<RangeResponse>(
    ["range", from, to, channelCsv],
    () => fetchRange(from, to, channelCsv || undefined),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  const loadEarlier = useCallback(() => setFrom((f) => shiftDate(f, -PAGE)), []);
  const loadLater = useCallback(() => setTo((t) => shiftDate(t, PAGE)), []);

  // Mutations revalidate the current window after the server confirms.
  const refresh = useCallback(() => mutate(), [mutate]);

  const addTask = useCallback(
    async (date: string, title: string) => {
      const input: TaskInput = { title, status: "planned", plannedDate: date };
      await createTask(input);
      await refresh();
    },
    [refresh],
  );

  const toggleTaskDone = useCallback(
    async (task: Task) => {
      await updateTask(task.id, { status: task.status === "done" ? "planned" : "done" });
      await refresh();
    },
    [refresh],
  );

  const editTask = useCallback(
    async (id: string, input: Partial<TaskInput>) => {
      await updateTask(id, input);
      await refresh();
    },
    [refresh],
  );

  const moveTask = useCallback(
    async (id: string, date: string | null, order?: number) => {
      await updateTask(id, { plannedDate: date, order });
      await refresh();
    },
    [refresh],
  );

  const moveAndReorder = useCallback(
    async (id: string, date: string, orderedIds: string[]) => {
      await updateTask(id, { plannedDate: date });
      await reorderTasksApi(date, orderedIds);
      await refresh();
    },
    [refresh],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await refresh();
    },
    [refresh],
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      await addSubtaskApi(taskId, title);
      await refresh();
    },
    [refresh],
  );

  const toggleSubtask = useCallback(
    async (taskId: string, subId: string, completed: boolean) => {
      await updateSubtaskApi(taskId, subId, { completed });
      await refresh();
    },
    [refresh],
  );

  const renameSubtask = useCallback(
    async (taskId: string, subId: string, title: string) => {
      await updateSubtaskApi(taskId, subId, { title });
      await refresh();
    },
    [refresh],
  );

  const removeSubtask = useCallback(
    async (taskId: string, subId: string) => {
      await deleteSubtaskApi(taskId, subId);
      await refresh();
    },
    [refresh],
  );

  const reorderSubtasks = useCallback(
    async (taskId: string, orderedIds: string[]) => {
      await reorderSubtasksApi(taskId, orderedIds);
      await refresh();
    },
    [refresh],
  );

  const startTimer = useCallback(
    async (taskId: string) => {
      await startTimerApi(taskId);
      await refresh();
    },
    [refresh],
  );

  const stopTimer = useCallback(
    async (taskId: string) => {
      await stopTimerApi(taskId);
      await refresh();
    },
    [refresh],
  );

  const reorderTasks = useCallback(
    async (day: string | null, orderedIds: string[]) => {
      await reorderTasksApi(day, orderedIds);
      await refresh();
    },
    [refresh],
  );

  return {
    days: data?.days ?? [],
    timezone: data?.timezone ?? tz,
    today,
    isLoading,
    isValidating,
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
