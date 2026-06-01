import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, BacklogGroup } from "@/types";

/** Fetch the backlog grouped into ordered buckets. */
export async function fetchBacklog(): Promise<BacklogGroup[]> {
  const { data } = await apiClient.get<ApiSuccess<{ buckets: BacklogGroup[] }>>(
    "/tasks/backlog",
  );
  return data.data.buckets;
}
