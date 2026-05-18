import { CreatorFormState, GENRES } from './types';

interface Props {
  form: CreatorFormState;
  toggleGenre: (g: string) => void;
}

export default function StepGenre({ form, toggleGenre }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-chalk">Your Content Genre</h2>
      <p className="text-sm text-chalk-dim">Select all that apply — brands filter by this</p>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => toggleGenre(g)}
            className={`goal-chip px-4 py-2 text-sm ${form.genres.includes(g) ? 'selected' : ''}`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
