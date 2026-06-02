import { useCallback } from "react";
import useSWR from "swr";
import {
  createChannel,
  deleteChannel,
  listChannels,
  updateChannel,
  type ChannelInput,
} from "@/api/channels";
import type { Channel } from "@/types";

export function useChannels() {
  const { data, error, isLoading, mutate } = useSWR<Channel[]>("channels", listChannels, {
    revalidateOnFocus: false,
  });

  const add = useCallback(
    async (input: ChannelInput) => {
      const created = await createChannel(input);
      await mutate();
      return created;
    },
    [mutate],
  );

  const edit = useCallback(
    async (id: string, input: Partial<ChannelInput>) => {
      const updated = await updateChannel(id, input);
      await mutate();
      return updated;
    },
    [mutate],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteChannel(id);
      await mutate();
    },
    [mutate],
  );

  return {
    channels: data ?? [],
    isLoading,
    error,
    addChannel: add,
    editChannel: edit,
    removeChannel: remove,
  };
}
