import type { Channel } from "@/types";

interface ChannelChipProps {
  channel: Channel;
  active?: boolean;
  onClick?: () => void;
}

/** A small colored channel pill, optionally toggleable (for filtering). */
export function ChannelChip({ channel, active, onClick }: ChannelChipProps) {
  const interactive = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-line text-ink-muted hover:border-primary/40"
      } ${interactive ? "cursor-pointer" : "cursor-default"}`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: channel.color }}
      />
      {channel.name}
    </button>
  );
}
