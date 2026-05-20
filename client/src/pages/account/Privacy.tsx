import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Download, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { PreferenceToggle } from './components/PreferenceToggle';
import { SectionHeader } from './components/SectionHeader';
import { keys } from '@/lib/queryKeys';

export default function Privacy() {
  const { user, isSuperAdmin, viewAs } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const role = isSuperAdmin ? (viewAs ?? user?.role) : user?.role;
  const isCreator = role === 'influencer';
  const [requestingExport, setRequestingExport] = useState(false);

  useEffect(() => { document.title = 'Data & Privacy — Kalakaarian'; }, []);

  const { data: prefs, isLoading } = useQuery({
    queryKey: keys.account.preferences(),
    queryFn: () => api.getPreferences(),
    staleTime: 60_000,
  });

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof api.updatePreferences>[0]) => api.updatePreferences(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.account.preferences() });
      toast({ title: 'Preferences saved' });
    },
    onError: () => toast({ title: 'Save failed', variant: 'destructive' }),
  });

  const privacy = (prefs?.privacy ?? {}) as Record<string, unknown>;
  const notifs = (prefs?.notifications ?? {}) as Record<string, boolean>;

  const setPrivacy = (key: string, val: boolean) =>
    updateMut.mutate({ privacy: { ...privacy, [key]: val } });

  const setNotif = (key: string, val: boolean) =>
    updateMut.mutate({ notifications: { ...notifs, [key]: val } });

  const handleDataExport = async () => {
    setRequestingExport(true);
    try {
      const res = await api.requestDataExport();
      toast({ title: 'Export requested', description: res.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Already pending or failed';
      toast({ title: 'Request failed', description: msg, variant: 'destructive' });
    } finally { setRequestingExport(false); }
  };

  const card = 'rounded-xl border border-white/10 bg-white/[0.03] p-5';

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Data & Privacy" subtitle="Control your visibility and notification preferences" />

      {/* Privacy toggles */}
      <div className={card}>
        <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide mb-1">Visibility</h2>
        <p className="text-xs text-chalk-dim mb-4">Control how you appear to others on the platform</p>

        <PreferenceToggle
          label="Marketplace Visible"
          description="Appear in brand search results"
          checked={privacy.marketplace_visible !== false}
          onChange={v => setPrivacy('marketplace_visible', v)}
          disabled={updateMut.isPending}
        />

        {isCreator && (
          <>
            <PreferenceToggle
              label="Discoverable"
              description="Allow brands to find your profile"
              checked={privacy.is_discoverable !== false}
              onChange={v => setPrivacy('is_discoverable', v)}
              disabled={updateMut.isPending}
            />
            <PreferenceToggle
              label="Show Online Status"
              description="Display your active/offline status on your profile"
              checked={privacy.presence_visible !== false}
              onChange={v => setPrivacy('presence_visible', v)}
              disabled={updateMut.isPending}
            />
          </>
        )}
      </div>

      {/* Notification prefs */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide">Notifications</h2>
        </div>

        {[
          { key: 'campaigns', label: 'Campaign Opportunities', desc: isCreator ? 'New campaigns matching your niche' : 'When creators match your campaigns' },
          { key: 'proposals', label: 'Proposal Updates', desc: 'Notifications on proposal status changes' },
          { key: 'messages', label: 'Messages', desc: 'New messages from the platform' },
          { key: 'payments', label: 'Payment Alerts', desc: 'Payment confirmations and reminders' },
          { key: 'marketing', label: 'Marketing & Tips', desc: 'Platform news and growth tips' },
        ].map(({ key, label, desc }) => (
          <PreferenceToggle
            key={key}
            label={label}
            description={desc}
            checked={notifs[key] !== false}
            onChange={v => setNotif(key, v)}
            disabled={updateMut.isPending}
          />
        ))}
      </div>

      {/* Data export */}
      <div className={card}>
        <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide mb-1">Your Data</h2>
        <p className="text-xs text-chalk-dim mb-4">Request a copy of your personal data. We'll process the request within 30 days.</p>
        <button
          type="button"
          onClick={handleDataExport}
          disabled={requestingExport}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          {requestingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Request data export
        </button>
      </div>
    </div>
  );
}
