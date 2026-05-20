import { CreatorFormState, GENRES } from './types';

interface Props {
  form: CreatorFormState;
  toggleGenre: (g: string) => void;
}

const MAX_GENRES = 3;

export default function StepGenre({ form, toggleGenre }: Props) {
  const atCap = form.genres.length >= MAX_GENRES;
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-chalk">Your Content Genre</h2>
      <p className="text-sm text-chalk-dim">
        Pick up to {MAX_GENRES} genres — brands filter by this&nbsp;
        <span className={atCap ? 'text-purple-400 font-semibold' : 'text-chalk-faint'}>
          ({form.genres.length}/{MAX_GENRES})
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => {
          const selected = form.genres.includes(g);
          const disabled = atCap && !selected;
          return (
            <button
              key={g}
              type="button"
              onClick={() => toggleGenre(g)}
              disabled={disabled}
              className={`goal-chip px-4 py-2 text-sm ${selected ? 'selected' : ''} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}
