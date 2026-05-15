import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, X } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleDelete = async () => {
    if (!password.trim()) {
      toast({ title: "Password required", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await api.deleteAccount(password);
      logout();
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Deletion failed",
        description: err?.message ?? "Incorrect password or server error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setPassword(""); onClose(); };

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
          This permanently deletes your account and all associated data. <span className="text-red-400 font-medium">This cannot be undone.</span>
        </p>

        <div>
          <label className="block text-xs text-chalk-dim mb-1.5">Confirm your password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
            placeholder="Enter password to confirm"
            className="dark-input w-full px-4 py-2.5 text-sm"
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
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
