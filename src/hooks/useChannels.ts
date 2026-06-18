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

  const addMutation = useMutation({
    mutationFn: (input: ChannelInput) => createChannel(input),
    onSettled: invalidate,
  });
  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ChannelInput> }) =>
      updateChannel(id, input),
    onSettled: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteChannel(id),
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
