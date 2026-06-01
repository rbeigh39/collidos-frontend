import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, RangeResponse } from "@/types";

/** Fetch the day-bucketed task feed for [from, to] (YYYY-MM-DD, user's tz). */
export async function fetchRange(
  from: string,
  to: string,
  channel?: string,
): Promise<RangeResponse> {
  const { data } = await apiClient.get<ApiSuccess<RangeResponse>>("/tasks/range", {
    params: { from, to, ...(channel ? { channel } : {}) },
  });
  return data.data;
}
