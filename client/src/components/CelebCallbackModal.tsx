import { useState } from "react";
import { X, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  influencerId: string;
  influencerName: string;
  onClose: () => void;
}

export function CelebCallbackModal({ influencerId, influencerName, onClose }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await api.requestCelebCallback({ influencerId, name, email, phone, message });
      setDone(true);
    } catch {
      toast({ title: "Failed to submit", description: "Try again or use the Contact page", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-obsidian border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-chalk">Request Callback</h2>
              <p className="text-xs text-chalk-dim mt-0.5">with {influencerName}</p>
            </div>
            <button onClick={onClose} className="p-1 text-chalk-dim hover:text-chalk"><X className="w-4 h-4" /></button>
          </div>

          {done ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-medium text-chalk">Request Submitted!</p>
              <p className="text-sm text-chalk-dim">Our team will reach out within 24 hours.</p>
              <button onClick={onClose} className="purple-pill px-6 py-2 text-sm mt-4">Close</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-chalk-dim mb-1.5">Your Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="dark-input w-full px-3 py-2.5 text-sm" placeholder="Priya Sharma" />
              </div>
              <div>
                <label className="block text-xs text-chalk-dim mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="dark-input w-full px-3 py-2.5 text-sm" placeholder="priya@brand.com" />
              </div>
              <div>
                <label className="block text-xs text-chalk-dim mb-1.5">WhatsApp / Phone *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="dark-input w-full px-3 py-2.5 text-sm" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-xs text-chalk-dim mb-1.5">Message (optional)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  rows={2} maxLength={300}
                  className="dark-input w-full px-3 py-2.5 text-sm resize-none" placeholder="Brief about your campaign..." />
              </div>
              <button onClick={submit} disabled={loading}
                className="gold-pill w-full py-2.5 text-sm disabled:opacity-50 mt-2">
                {loading ? "Submitting…" : "Request Callback"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
