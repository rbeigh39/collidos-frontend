interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Accessible on/off switch used in settings. */
export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 py-2">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="text-xs text-ink-muted">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
