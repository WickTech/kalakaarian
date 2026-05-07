import { useState } from 'react';
import { Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface Props {
  proposalId: string;
  role: 'brand' | 'influencer';
  stage: string | null;
}

const RATABLE = new Set(['approved', 'payment_pending', 'payment_released']);

export function RatingWidget({ proposalId, role, stage }: Props) {
  const qc = useQueryClient();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [review, setReview] = useState('');

  const eligible = role === 'brand' && !!stage && RATABLE.has(stage);

  const { data } = useQuery({
    queryKey: ['proposal-rating', proposalId],
    queryFn: () => api.getProposalRating(proposalId),
    enabled: eligible,
  });

  const mutation = useMutation({
    mutationFn: () => api.submitRating(proposalId, selected, review || undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposal-rating', proposalId] }),
  });

  if (!eligible) return null;

  if (data?.rating) {
    const r = data.rating;
    return (
      <div className="bento-card-dark p-4 rounded-xl mt-4">
        <p className="text-xs text-chalk-dim uppercase tracking-wider mb-2">Your Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`w-5 h-5 ${n <= r.score ? 'text-gold fill-gold' : 'text-chalk-faint'}`} />
          ))}
          <span className="text-sm text-chalk-dim ml-2">{r.score}/5</span>
        </div>
        {r.review && <p className="text-xs text-chalk-dim mt-1 italic">"{r.review}"</p>}
      </div>
    );
  }

  return (
    <div className="bento-card-dark p-4 rounded-xl mt-4">
      <p className="text-xs text-chalk-dim uppercase tracking-wider mb-3">Rate this Creator</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(n)}
            type="button"
          >
            <Star className={`w-7 h-7 transition-colors ${n <= (hovered || selected) ? 'text-gold fill-gold' : 'text-chalk-faint'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={500}
        placeholder="Optional: share your experience..."
        className="w-full bg-charcoal/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-chalk placeholder:text-chalk-faint focus:outline-none focus:border-gold/50 resize-none h-16 mb-3"
      />
      <Button
        onClick={() => mutation.mutate()}
        disabled={selected === 0 || mutation.isPending}
        className="bg-gold hover:bg-gold/90 text-obsidian text-sm font-bold px-4 py-1.5"
      >
        {mutation.isPending ? 'Saving…' : 'Submit Rating'}
      </Button>
    </div>
  );
}
