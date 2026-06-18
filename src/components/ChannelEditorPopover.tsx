import { FormEvent, useEffect, useRef, useState } from "react";
import type { Channel } from "@/types";

interface ChannelEditorPopoverProps {
  channel: Channel;
  swatches: string[];
  onSave: (input: { name: string; color: string }) => void;
  onDelete: () => void;
  onClose: () => void;
  /** Inline error (e.g. duplicate-name conflict) to surface under the input. */
  error?: string | null;
}

/**
 * Small popover to rename, recolor, or delete a channel. Anchored to the chip
 * being edited; closes on Escape or click-outside. Reuses the name + swatch
 * picker from the channel create form.
 */
export function ChannelEditorPopover({
  channel,
  swatches,
  onSave,
  onDelete,
  onClose,
  error,
}: ChannelEditorPopoverProps) {
  const [name, setName] = useState(channel.name);
  const [color, setColor] = useState(channel.color);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Escape-to-close + click-outside-to-close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color });
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Edit channel ${channel.name}`}
      className="absolute left-0 top-full z-50 mt-1 w-56 rounded-card border border-line bg-surface p-3 shadow-pop"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Channel name"
          aria-label="Channel name"
          className="rounded-control border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-primary"
        />
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <div className="flex items-center gap-1">
          {swatches.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`Color ${s}`}
              onClick={() => setColor(s)}
              className={`h-4 w-4 rounded-full ${color === s ? "ring-2 ring-offset-1 ring-ink/40" : ""}`}
              style={{ backgroundColor: s }}
            />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <button type="submit" className="btn-ghost px-2 py-1 text-xs">
            Save
          </button>
          {confirmingDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-danger hover:underline"
            >
              Confirm delete
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-xs text-ink-subtle hover:text-danger"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
