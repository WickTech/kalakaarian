interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function PreferenceToggle({ label, description, checked, onChange, disabled }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-chalk">{label}</p>
        {description && <p className="text-xs text-chalk-dim mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 disabled:opacity-40 ${checked ? 'bg-purple-600' : 'bg-white/10'}`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
