interface Props {
  steps: readonly string[];
  current: number;
  onSelect: (i: number) => void;
}

export default function StepperNav({ steps, current, onSelect }: Props) {
  return (
    <aside className="md:sticky md:top-20 self-start">
      <nav className="space-y-1 p-2 rounded-xl border border-white/10 bg-white/[0.02]">
        {steps.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const clickable = done;
          return (
            <button
              key={label}
              type="button"
              onClick={() => clickable && onSelect(i)}
              disabled={!clickable && !isCurrent}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                isCurrent
                  ? 'bg-purple-600/15 text-chalk border border-purple-500/30'
                  : done
                  ? 'text-chalk-dim hover:text-chalk hover:bg-white/5 cursor-pointer'
                  : 'text-chalk-faint cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done
                    ? 'bg-green-500/20 text-green-300'
                    : isCurrent
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-white/5 text-chalk-faint'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
