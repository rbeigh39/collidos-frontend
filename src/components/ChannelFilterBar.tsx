import { FormEvent, ReactNode, useState } from "react";
import { ChannelChip } from "@/components/ChannelChip";
import { ChannelEditorPopover } from "@/components/ChannelEditorPopover";
import type { Channel } from "@/types";

// Preset swatches drawn from the design palette.
const SWATCHES = ["#6c5ce7", "#ff7a59", "#3bbf86", "#f2b34a", "#e5604d", "#4aa3f2", "#9b9aa6"];

// Pull a human-readable message off a failed mutation (e.g. duplicate-name conflict).
function errorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string } }; message?: string })
    ?.response?.data?.message;
  if (msg) return msg;
  return "Something went wrong. Please try again.";
}

interface ChannelFilterBarProps {
  channels: Channel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onCreate: (input: { name: string; color: string }) => Promise<unknown>;
  onEdit: (id: string, input: { name: string; color: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  /** Right-aligned actions (e.g. the Backlog toggle). */
  rightSlot?: ReactNode;
}

export function ChannelFilterBar({
  channels,
  selectedIds,
  onToggle,
  onClear,
  onCreate,
  onEdit,
  onDelete,
  rightSlot,
}: ChannelFilterBarProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate({ name: trimmed, color });
    setName("");
    setColor(SWATCHES[0]);
    setAdding(false);
  }

  function closeEditor() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleEdit(id: string, input: { name: string; color: string }) {
    try {
      await onEdit(id, input);
      closeEditor();
    } catch (err) {
      setEditError(errorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete(id);
      closeEditor();
    } catch (err) {
      setEditError(errorMessage(err));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas px-6 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        Channels
      </span>

      {channels.map((c) => (
        <span key={c.id} className="relative inline-flex">
          <ChannelChip
            channel={c}
            active={selectedIds.includes(c.id)}
            onClick={() => onToggle(c.id)}
            onEdit={() => {
              setEditError(null);
              setEditingId(c.id);
            }}
          />
          {editingId === c.id ? (
            <ChannelEditorPopover
              channel={c}
              swatches={SWATCHES}
              error={editError}
              onSave={(input) => void handleEdit(c.id, input)}
              onDelete={() => void handleDelete(c.id)}
              onClose={closeEditor}
            />
          ) : null}
        </span>
      ))}

      {selectedIds.length > 0 ? (
        <button onClick={onClear} className="text-xs text-ink-subtle hover:text-ink">
          Clear filter
        </button>
      ) : null}

      {adding ? (
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name"
            className="rounded-control border border-line bg-surface px-2 py-1 text-xs text-ink"
          />
          <div className="flex items-center gap-1">
            {SWATCHES.map((s) => (
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
          <button type="submit" className="btn-ghost px-2 py-1 text-xs">
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-xs text-ink-subtle hover:text-ink"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-primary hover:underline"
        >
          + Channel
        </button>
      )}

      {rightSlot ? <div className="ml-auto">{rightSlot}</div> : null}
    </div>
  );
}
