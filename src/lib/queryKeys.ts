/**
 * Single source of truth for TanStack Query cache keys.
 *
 * Keys are hierarchical so invalidation can be coarse or precise: every range
 * window shares the `["range", …]` prefix, so `invalidateQueries({ queryKey:
 * qk.rangeRoot })` refetches *all* cached windows at once, while a single window
 * is addressed by its full `qk.range(from, to, channels)` key. Define every key
 * here — never inline a string/array key at a call site — so the factory stays
 * the one place that has to agree with itself.
 */
export const qk = {
  /** One day-bucketed range window. `channels` is the CSV of channel ids. */
  range: (from: string, to: string, channels: string) =>
    ["range", { from, to, channels }] as const,
  /** Prefix matching every range window — invalidate all of them together. */
  rangeRoot: ["range"] as const,
  channels: ["channels"] as const,
  objectives: (weekStart: string) => ["objectives", { weekStart }] as const,
  backlog: ["backlog"] as const,
};
