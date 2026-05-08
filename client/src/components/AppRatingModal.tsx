import { useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  onClose: () => void;
}

export function AppRatingModal({ onClose }: Props) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) return;
    setLoading(true);
    try {
      await api.submitAppRating({ score, feedback: feedback.trim() || undefined });
    } catch {
      // best-effort; don't block user on failure
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bento-card p-6 space-y-5 text-center">
        {submitted ? (
          <>
            <div className="text-4xl">🎉</div>
            <p className="font-display font-bold text-chalk text-lg">Thanks for your feedback!</p>
            <p className="text-chalk-dim text-sm">Your review helps us improve Kalakaarian.</p>
            <button onClick={onClose} className="purple-pill w-full py-2.5 text-sm">Done</button>
          </>
        ) : (
          <>
            <div className="text-3xl">⭐</div>
            <p className="font-display font-bold text-chalk text-lg">How's your experience?</p>
            <p className="text-chalk-dim text-sm">Rate your experience with Kalakaarian</p>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setScore(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= (hover || score) ? "fill-gold text-gold" : "text-chalk-faint"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more (optional)…"
              rows={3}
              maxLength={300}
              className="dark-input w-full px-4 py-3 text-sm resize-none"
            />

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-white/10 text-chalk-dim hover:text-chalk text-sm transition-colors">
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={score === 0 || loading}
                className="flex-1 purple-pill py-2.5 text-sm disabled:opacity-40"
              >
                {loading ? "Submitting…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
