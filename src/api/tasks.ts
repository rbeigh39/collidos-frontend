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
  plannedDate?: string;
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
