import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, Task, TaskStatus } from "@/types";

export interface TaskListParams {
  status?: TaskStatus;
  from?: string;
  to?: string;
}

export interface TaskInput {
  title: string;
  notes?: string;
  status?: TaskStatus;
  /** Calendar day YYYY-MM-DD, or null to unschedule (move to backlog). */
  plannedDate?: string | null;
  timeEstimateMinutes?: number;
  channel?: string;
  order?: number;
}

export async function listTasks(params: TaskListParams = {}): Promise<Task[]> {
  const { data } = await apiClient.get<ApiSuccess<{ tasks: Task[] }>>("/tasks", {
    params,
  });
  return data.data.tasks;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await apiClient.post<ApiSuccess<{ task: Task }>>("/tasks", input);
  return data.data.task;
}

export async function updateTask(
  id: string,
  input: Partial<TaskInput>,
): Promise<Task> {
  const { data } = await apiClient.patch<ApiSuccess<{ task: Task }>>(
    `/tasks/${id}`,
    input,
  );
  return data.data.task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

// ─── Subtasks (all return the updated parent task) ──────────────────────────

export async function addSubtask(taskId: string, title: string): Promise<Task> {
  const { data } = await apiClient.post<ApiSuccess<{ task: Task }>>(
    `/tasks/${taskId}/subtasks`,
    { title },
  );
  return data.data.task;
}

export async function updateSubtask(
  taskId: string,
  subId: string,
  input: { title?: string; completed?: boolean },
): Promise<Task> {
  const { data } = await apiClient.patch<ApiSuccess<{ task: Task }>>(
    `/tasks/${taskId}/subtasks/${subId}`,
    input,
  );
  return data.data.task;
}

export async function deleteSubtask(taskId: string, subId: string): Promise<Task> {
  const { data } = await apiClient.delete<ApiSuccess<{ task: Task }>>(
    `/tasks/${taskId}/subtasks/${subId}`,
  );
  return data.data.task;
}

export async function reorderSubtasks(
  taskId: string,
  orderedIds: string[],
): Promise<Task> {
  const { data } = await apiClient.patch<ApiSuccess<{ task: Task }>>(
    `/tasks/${taskId}/subtasks/reorder`,
    { orderedIds },
  );
  return data.data.task;
}
