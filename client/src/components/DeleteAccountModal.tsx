import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: Props) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const canSubmit = confirmation === "delete";

  const handleDelete = async () => {
    if (!canSubmit) {
      toast({ title: 'Type "delete" to confirm', variant: "destructive" }); return;
    }
    setPasswordError("");
    setLoading(true);
    try {
      await api.deleteAccount(password || undefined);
      logout();
      navigate("/");
    } catch (err) {
      const msg = (err as Error)?.message ?? "Server error. Please try again.";
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("incorrect")) {
        setPasswordError(msg);
      } else {
        toast({ title: "Deletion failed", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setPassword(""); setConfirmation(""); setPasswordError(""); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-charcoal border border-red-500/20 rounded-2xl p-6 w-full max-w-sm space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
            <h2 className="text-chalk font-bold text-lg">Delete Account</h2>
          </div>
          <button onClick={handleClose} className="text-chalk-faint hover:text-chalk transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-chalk-dim">
          This permanently deletes your account and all associated data.{" "}
          <span className="text-red-400 font-medium">This cannot be undone.</span>
        </p>

        <div>
          <label className="block text-xs text-chalk-dim mb-1.5">
            Password <span className="text-chalk-faint">(not required for Google Sign-In)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              placeholder="Your current password"
              className={`dark-input w-full px-4 py-2.5 text-sm pr-10 ${passwordError ? "border-red-500/60" : ""}`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-faint hover:text-chalk"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-chalk-dim mb-1.5">
            Type <span className="font-mono font-bold text-red-400">delete</span> to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleDelete()}
            placeholder="delete"
            className="dark-input w-full px-4 py-2.5 text-sm font-mono"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-full text-sm border border-white/10 text-chalk-dim hover:text-chalk transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || !canSubmit}
            className="flex-1 py-2.5 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
