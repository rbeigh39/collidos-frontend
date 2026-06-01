import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, Objective } from "@/types";

export interface ObjectiveInput {
  title: string;
  weekStart: string;
  channelRef?: string | null;
  notes?: string;
  order?: number;
  completed?: boolean;
}

export async function listObjectives(weekStart: string): Promise<Objective[]> {
  const { data } = await apiClient.get<ApiSuccess<{ objectives: Objective[] }>>(
    "/objectives",
    { params: { weekStart } },
  );
  return data.data.objectives;
}

export async function createObjective(input: ObjectiveInput): Promise<Objective> {
  const { data } = await apiClient.post<ApiSuccess<{ objective: Objective }>>(
    "/objectives",
    input,
  );
  return data.data.objective;
}

export async function updateObjective(
  id: string,
  input: Partial<ObjectiveInput>,
): Promise<Objective> {
  const { data } = await apiClient.patch<ApiSuccess<{ objective: Objective }>>(
    `/objectives/${id}`,
    input,
  );
  return data.data.objective;
}

export async function deleteObjective(id: string): Promise<void> {
  await apiClient.delete(`/objectives/${id}`);
}

export async function extendObjectiveWeek(id: string): Promise<Objective> {
  const { data } = await apiClient.post<ApiSuccess<{ objective: Objective }>>(
    `/objectives/${id}/extend-week`,
  );
  return data.data.objective;
}
