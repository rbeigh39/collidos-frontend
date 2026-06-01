import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess, Channel } from "@/types";

export interface ChannelInput {
  name: string;
  color: string;
  order?: number;
  archived?: boolean;
}

export async function listChannels(): Promise<Channel[]> {
  const { data } = await apiClient.get<ApiSuccess<{ channels: Channel[] }>>("/channels");
  return data.data.channels;
}

export async function createChannel(input: ChannelInput): Promise<Channel> {
  const { data } = await apiClient.post<ApiSuccess<{ channel: Channel }>>(
    "/channels",
    input,
  );
  return data.data.channel;
}

export async function updateChannel(
  id: string,
  input: Partial<ChannelInput>,
): Promise<Channel> {
  const { data } = await apiClient.patch<ApiSuccess<{ channel: Channel }>>(
    `/channels/${id}`,
    input,
  );
  return data.data.channel;
}

export async function deleteChannel(id: string): Promise<void> {
  await apiClient.delete(`/channels/${id}`);
}
