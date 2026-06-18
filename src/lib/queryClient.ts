import { QueryClient } from "@tanstack/react-query";

/**
 * The app's single QueryClient. Defaults mirror the old SWR config: don't
 * refetch on window focus (the board is long-lived and mutations already
 * invalidate precisely), and treat data as fresh briefly to dedupe the bursts
 * of queries that mount together.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
  },
});
