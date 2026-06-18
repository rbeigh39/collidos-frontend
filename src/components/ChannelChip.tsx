import type { Channel } from "@/types";

interface ChannelChipProps {
  channel: Channel;
  active?: boolean;
  onClick?: () => void;
  /** When provided, a pencil affordance reveals on hover to edit the channel. */
  onEdit?: () => void;
}

/** A small colored channel pill, optionally toggleable (for filtering). */
export function ChannelChip({ channel, active, onClick, onEdit }: ChannelChipProps) {
  const interactive = typeof onClick === "function";
  const chip = (
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

  if (!onEdit) return chip;

  return (
    <span className="group relative inline-flex items-center">
      {chip}
      <button
        type="button"
        aria-label={`Edit channel ${channel.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="ml-1 text-ink-subtle opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
      >
        ✎
      </button>
    </span>
  );
}
