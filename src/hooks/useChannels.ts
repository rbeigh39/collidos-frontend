import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChannel,
  deleteChannel,
  listChannels,
  updateChannel,
  type ChannelInput,
} from "@/api/channels";
import { qk } from "@/lib/queryKeys";
import { tempId } from "@/lib/ids";
import type { Channel } from "@/types";

export function useChannels() {
  const client = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: qk.channels,
    queryFn: listChannels,
  });

  // Cards render channel colour/name, so any channel change must also refresh
  // every range window.
  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: qk.channels });
    void client.invalidateQueries({ queryKey: qk.rangeRoot });
  }, [client]);

  // Snapshot + restore the channels list around an optimistic change.
  const snapshotChannels = useCallback(async () => {
    await client.cancelQueries({ queryKey: qk.channels });
    const previous = client.getQueryData<Channel[]>(qk.channels);
    return previous;
  }, [client]);
  const restoreChannels = useCallback(
    (previous: Channel[] | undefined) => {
      if (previous) client.setQueryData(qk.channels, previous);
    },
    [client],
  );

  const addMutation = useMutation({
    mutationFn: (input: ChannelInput) => createChannel(input),
    onMutate: async (input: ChannelInput) => {
      const previous = await snapshotChannels();
      const optimistic: Channel = {
        id: tempId(),
        name: input.name,
        color: input.color,
        order: input.order ?? Number.MAX_SAFE_INTEGER,
        archived: input.archived ?? false,
      };
      client.setQueryData<Channel[]>(qk.channels, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (_e, _v, ctx) => restoreChannels(ctx?.previous),
    onSettled: invalidate,
  });
  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ChannelInput> }) =>
      updateChannel(id, input),
    onSettled: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteChannel(id),
    onMutate: async (id: string) => {
      const previous = await snapshotChannels();
      client.setQueryData<Channel[]>(qk.channels, (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => restoreChannels(ctx?.previous),
    onSettled: invalidate,
  });

  const addChannel = useCallback(
    (input: ChannelInput) => addMutation.mutateAsync(input),
    [addMutation],
  );
  const editChannel = useCallback(
    (id: string, input: Partial<ChannelInput>) =>
      editMutation.mutateAsync({ id, input }),
    [editMutation],
  );
  const removeChannel = useCallback(
    (id: string) => removeMutation.mutateAsync(id),
    [removeMutation],
  );

  return {
    channels: (data ?? []) as Channel[],
    isLoading,
    error,
    addChannel,
    editChannel,
    removeChannel,
  };
}
