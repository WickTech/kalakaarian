import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WalletProps { earnings: number; pendingTotal: number; }

const STATUS_COLORS: Record<string, string> = {
  paid: "text-green-400 border-green-400/30",
  processing: "text-blue-400 border-blue-400/30",
  pending: "text-gold border-gold/30",
  failed: "text-red-400 border-red-400/30",
};

export function WalletTab({ earnings, pendingTotal }: WalletProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showDrawer, setShowDrawer] = useState(false);
  const [upiId, setUpiId] = useState("");

  const { data: txData } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => api.getTransactionHistory(),
    staleTime: 30_000,
  });

  const withdraw = useMutation({
    mutationFn: () => api.requestWithdrawal(earnings, upiId),
    onSuccess: () => {
      toast({ title: "Request submitted", description: "Processed within 5–7 business days." });
      setShowDrawer(false);
      setUpiId("");
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to submit request", variant: "destructive" }),
  });

  const handleWithdraw = () => {
    if (!upiId.trim()) { toast({ title: "Enter UPI ID", variant: "destructive" }); return; }
    withdraw.mutate();
  };

  const transactions = txData?.transactions ?? [];

  return (
    <div className="space-y-4">
      <div className="wallet-card p-6 rounded-xl">
        <p className="text-xs text-chalk-dim mb-1">Total Earnings</p>
        <p className="font-display font-bold text-3xl text-chalk">₹{earnings.toLocaleString("en-IN")}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bento-card p-4">
          <p className="text-xs text-chalk-dim">⏳ Pending</p>
          <p className="font-bold text-xl text-chalk mt-1">₹{pendingTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="bento-card p-4">
          <p className="text-xs text-chalk-dim">✅ Approved</p>
          <p className="font-bold text-xl text-chalk mt-1">₹{earnings.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <button
        disabled={earnings === 0}
        onClick={() => setShowDrawer((v) => !v)}
        className="purple-pill w-full py-3 text-sm disabled:opacity-40"
      >
        {showDrawer ? "Cancel" : "Withdraw Earnings"}
      </button>

      {showDrawer && (
        <div className="bento-card p-4 space-y-3 border border-purple-500/20">
          <p className="text-sm font-semibold text-chalk">Withdraw ₹{earnings.toLocaleString("en-IN")}</p>
          <div>
            <label className="block text-xs text-chalk-dim mb-1.5">UPI ID</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="dark-input w-full px-4 py-3 text-sm"
              placeholder="name@upi"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={withdraw.isPending}
            className="purple-pill w-full py-2.5 text-sm disabled:opacity-50"
          >
            {withdraw.isPending ? "Submitting…" : "Confirm Withdrawal"}
          </button>
          <p className="text-[10px] text-chalk-faint text-center">Processed within 5–7 business days</p>
        </div>
      )}

      <p className="text-xs text-chalk-faint text-center">Withdrawals enabled only after campaign approval</p>

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-display font-bold text-chalk">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-chalk-dim text-center py-6">No transactions yet</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {["Date", "Campaign", "Amount", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-chalk-faint font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-2.5 text-chalk-dim whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-2.5 text-chalk max-w-[120px] truncate">{t.campaignTitle || "—"}</td>
                  <td className="px-4 py-2.5 text-chalk">₹{Number(t.amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[t.status] || "text-chalk-dim border-white/10"}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
