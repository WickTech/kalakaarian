import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter as FilterIcon, X } from 'lucide-react';
import { api, BrandTransaction } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const STATUS_STYLE: Record<string, string> = {
  completed: 'text-green-400 border-green-400/30 bg-green-400/5',
  pending:   'text-amber-400 border-amber-400/30 bg-amber-400/5',
  failed:    'text-red-400 border-red-400/30 bg-red-400/5',
  refunded:  'text-blue-400 border-blue-400/30 bg-blue-400/5',
};

const STATUSES = ['', 'completed', 'pending', 'failed', 'refunded'] as const;

export function BrandTransactionsPanel() {
  const { toast } = useToast();
  const [creatorId,  setCreatorId]  = useState<string>('');
  const [campaignId, setCampaignId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to,   setTo]   = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const filters = useMemo(() => ({ creatorId: creatorId || undefined, campaignId: campaignId || undefined,
    from: from || undefined, to: to ? `${to}T23:59:59` : undefined, status: status || undefined }),
    [creatorId, campaignId, from, to, status]);

  const { data, isLoading } = useQuery({
    queryKey: ['brand-transactions', filters],
    queryFn: () => api.getBrandTransactions(filters),
    staleTime: 30_000,
  });

  const { data: filterOpts } = useQuery({
    queryKey: ['brand-transaction-filters'],
    queryFn: () => api.getBrandTransactionFilters(),
    staleTime: 5 * 60_000,
  });

  const transactions: BrandTransaction[] = data?.transactions ?? [];
  const total = transactions.reduce((s, t) => s + (t.status === 'completed' ? t.amount : 0), 0);
  const anyFilter = !!(creatorId || campaignId || from || to || status);

  const reset = () => { setCreatorId(''); setCampaignId(''); setFrom(''); setTo(''); setStatus(''); };

  const handleDownload = async (txn: BrandTransaction) => {
    try { await api.downloadInvoice(txn.id, txn.invoiceNumber); }
    catch { toast({ title: 'Download failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bento-card p-4">
          <p className="text-xs text-chalk-dim">Total Paid</p>
          <p className="font-bold text-2xl text-chalk mt-1">₹{total.toLocaleString('en-IN')}</p>
        </div>
        <div className="bento-card p-4">
          <p className="text-xs text-chalk-dim">Transactions</p>
          <p className="font-bold text-2xl text-chalk mt-1">{transactions.length}</p>
        </div>
      </div>

      <div className="bento-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-chalk-dim"><FilterIcon className="w-3.5 h-3.5" /> Filters</div>
          {anyFilter && (
            <button onClick={reset} className="flex items-center gap-1 text-[11px] text-chalk-dim hover:text-chalk">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select value={creatorId} onChange={(e) => setCreatorId(e.target.value)}
                  className="dark-input px-2.5 py-2 text-xs">
            <option value="">All creators</option>
            {filterOpts?.creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
                  className="dark-input px-2.5 py-2 text-xs">
            <option value="">All campaigns</option>
            {filterOpts?.campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                 className="dark-input px-2.5 py-2 text-xs" placeholder="From" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                 className="dark-input px-2.5 py-2 text-xs" placeholder="To" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="dark-input px-2.5 py-2 text-xs">
            {STATUSES.map((s) => <option key={s} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : 'All status'}</option>)}
          </select>
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-display font-bold text-chalk">Transactions</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-chalk-dim text-center py-10">
            {anyFilter ? 'No transactions match these filters.' : 'No transactions yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Date', 'Invoice', 'Campaign', 'Creator', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-chalk-faint font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-2.5 text-chalk-dim whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-chalk-dim font-mono text-[10px]">{t.invoiceNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-chalk max-w-[140px] truncate">{t.campaignTitle || '—'}</td>
                    <td className="px-4 py-2.5 text-chalk max-w-[120px] truncate">{t.influencerName || '—'}</td>
                    <td className="px-4 py-2.5 text-chalk font-semibold">₹{t.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full border capitalize text-[10px] ${STATUS_STYLE[t.status] || 'text-chalk-dim border-white/10'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleDownload(t)}
                        disabled={t.status !== 'completed'}
                        title={t.status === 'completed' ? 'Download invoice' : 'Invoice available once completed'}
                        className="p-1.5 rounded hover:bg-purple-500/10 text-purple-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
