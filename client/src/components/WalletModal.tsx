import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ArrowRight } from "lucide-react";
import { api, InfluencerAnalytics } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const navigate = useNavigate();

  const { data: txData } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => api.getTransactionHistory(),
    staleTime: 30_000,
    enabled: open,
  });

  const { data: analytics } = useQuery({
    queryKey: ["influencer-analytics"],
    queryFn: () => api.getInfluencerAnalytics(),
    staleTime: 60_000,
    enabled: open,
  });

  const transactions = txData?.transactions ?? [];
  const totalEarnings = (analytics as InfluencerAnalytics)?.totalEarnings ?? 0;
  const pendingTotal = transactions
    .filter((t) => t.status === "pending" || t.status === "processing")
    .reduce((s, t) => s + Number(t.amount), 0);
  const currentBalance = Math.max(0, totalEarnings - pendingTotal);

  const goToWallet = () => {
    onClose();
    navigate("/influencer/dashboard?tab=wallet");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-obsidian border border-white/10 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2 text-chalk font-display">
            <Wallet className="w-4 h-4 text-gold" /> Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bento-card p-4 space-y-1">
              <p className="text-[10px] text-chalk-faint uppercase tracking-wide">Current Balance</p>
              <p className="text-xl font-display font-bold text-chalk">
                ₹{currentBalance.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bento-card p-4 space-y-1">
              <p className="text-[10px] text-chalk-faint uppercase tracking-wide">Total Earnings</p>
              <p className="text-xl font-display font-bold text-gold">
                ₹{totalEarnings.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {pendingTotal > 0 && (
            <div className="px-3 py-2 rounded-lg bg-gold/10 border border-gold/20 text-xs text-gold">
              ⏳ ₹{pendingTotal.toLocaleString("en-IN")} pending approval
            </div>
          )}

          <button
            onClick={goToWallet}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-sm text-purple-300 hover:bg-purple-600/30 transition-all font-medium"
          >
            View Transactions <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
