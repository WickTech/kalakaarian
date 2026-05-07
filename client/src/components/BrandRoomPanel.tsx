import { useState } from "react";
import { Link } from "react-router-dom";
import { X, CalendarDays } from "lucide-react";

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : initial; }
    catch { return initial; }
  });
  const set = (v: T) => { localStorage.setItem(key, JSON.stringify(v)); setState(v); };
  return [state, set];
}

interface Props { membershipTier?: string; }

export function BrandRoomPanel({ membershipTier }: Props) {
  const isRoom = membershipTier === "room";

  if (!isRoom) {
    return (
      <div className="bento-card membership-gold p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏠</span>
          <h2 className="font-display font-bold text-chalk text-xl">Your Room</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 ml-auto">₹999/month</span>
        </div>
        <p className="text-chalk-dim text-sm mb-4">Premium workspace for power brands</p>
        <ul className="space-y-2 text-sm text-chalk-dim mb-6">
          {["Save creator lists", "Schedule campaigns", "Payment integration", "Advanced analytics", "Priority notifications", "Dedicated support"].map(f => (
            <li key={f} className="flex items-center gap-2"><span className="text-gold">✓</span> {f}</li>
          ))}
        </ul>
        <button className="gold-pill px-6 py-2.5 text-sm">Activate Your Room →</button>
      </div>
    );
  }

  const [savedIds, setSavedIds] = useLocalStorage<string[]>("room_saved_creators", []);
  const [campaignDate, setCampaignDate] = useLocalStorage<string>("room_campaign_date", "");
  const [activeTs, setActiveTs] = useLocalStorage<string>("room_active_since", "");
  const [newId, setNewId] = useState("");

  const addCreator = () => {
    const trimmed = newId.trim();
    if (trimmed && !savedIds.includes(trimmed)) setSavedIds([...savedIds, trimmed]);
    setNewId("");
  };

  const removeCreator = (id: string) => setSavedIds(savedIds.filter((x) => x !== id));

  const daysUntil = campaignDate
    ? Math.ceil((new Date(campaignDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const toggleActive = () => {
    if (activeTs) { setActiveTs(""); }
    else { setActiveTs(new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })); }
  };

  return (
    <div className="space-y-4">
      <div className="bento-card membership-gold p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🏠</span>
          <h2 className="font-display font-bold text-chalk text-lg">Your Room</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 ml-auto">Active</span>
        </div>
        <p className="text-xs text-chalk-dim">Premium workspace</p>
      </div>

      <div className="bento-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-chalk">Saved Creators</h3>
        <div className="flex gap-2">
          <input value={newId} onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCreator()}
            className="dark-input flex-1 px-3 py-2 text-xs" placeholder="Influencer ID or name" />
          <button onClick={addCreator} className="purple-pill px-3 py-2 text-xs">Add</button>
        </div>
        {savedIds.length === 0 ? (
          <p className="text-xs text-chalk-faint">No creators saved yet</p>
        ) : (
          <div className="space-y-1.5">
            {savedIds.map((id) => (
              <div key={id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
                <Link to={`/influencer/${id}`} className="text-xs text-chalk hover:text-gold transition-colors truncate">{id}</Link>
                <button onClick={() => removeCreator(id)} className="text-chalk-faint hover:text-red-400 ml-2">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bento-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-chalk flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Campaign Start Date</h3>
        <input type="date" value={campaignDate} onChange={(e) => setCampaignDate(e.target.value)}
          className="dark-input w-full px-3 py-2 text-sm" />
        {daysUntil !== null && campaignDate && (
          <p className="text-xs text-chalk-dim">
            {daysUntil > 0
              ? `${daysUntil} day${daysUntil !== 1 ? "s" : ""} until campaign — prep brief ${Math.max(daysUntil - 7, 0)} days from now`
              : daysUntil === 0 ? "Campaign starts today!" : "Campaign date has passed"}
          </p>
        )}
      </div>

      <div className="bento-card p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-chalk">Active Status</h3>
          {activeTs && <p className="text-[10px] text-green-400">Active since {activeTs}</p>}
        </div>
        <button onClick={toggleActive}
          className={`w-10 h-5 rounded-full transition-all ${activeTs ? "bg-green-500" : "bg-white/10"}`}>
          <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${activeTs ? "translate-x-4" : ""}`} />
        </button>
      </div>
    </div>
  );
}
