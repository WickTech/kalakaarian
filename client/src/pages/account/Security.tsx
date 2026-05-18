import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, LogOut, MonitorSmartphone, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { SectionHeader } from './components/SectionHeader';

interface PwForm { current: string; next: string; confirm: string }

export default function Security() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState<PwForm>({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { document.title = 'Security — Kalakaarian'; }, []);

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toast({ title: "Passwords don't match", variant: 'destructive' }); return; }
    if (pw.next.length < 8) { toast({ title: 'Password must be 8+ characters', variant: 'destructive' }); return; }
    setPwSaving(true);
    try {
      await api.changePassword(pw.current, pw.next);
      toast({ title: 'Password updated' });
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Password update failed', variant: 'destructive' });
    } finally { setPwSaving(false); }
  };

  const handleSignOutAll = async () => {
    if (!confirm('Sign out from all devices? You will need to log in again.')) return;
    setSigningOut(true);
    try {
      await api.signOutAll();
      logout();
      navigate('/login');
    } catch { toast({ title: 'Failed to sign out', variant: 'destructive' }); setSigningOut(false); }
  };

  const field = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-chalk placeholder:text-chalk-dim focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors';
  const card = 'rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4';

  return (
    <div className="space-y-6">
      <SectionHeader title="Security & Sign-in" subtitle="Manage your password and active sessions" />

      {/* Change password */}
      <form onSubmit={handlePassword} className={card}>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Change Password</h2>
        </div>
        {(['current', 'next', 'confirm'] as const).map((id) => (
          <div key={id} className="grid gap-1.5">
            <Label className="text-xs text-chalk-dim">
              {id === 'current' ? 'Current Password' : id === 'next' ? 'New Password' : 'Confirm New Password'}
            </Label>
            <input
              type="password"
              value={pw[id]}
              onChange={e => setPw(p => ({ ...p, [id]: e.target.value }))}
              placeholder={id === 'next' ? 'Min 8 characters' : '••••••••'}
              className={field}
            />
          </div>
        ))}
        <Button type="submit" disabled={pwSaving} variant="outline" className="w-full border-white/10 text-chalk hover:bg-white/5">
          {pwSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : 'Update Password'}
        </Button>
      </form>

      {/* Sessions */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Devices & Sessions</h2>
        </div>
        <p className="text-xs text-chalk-dim">
          Sign out from all browsers and devices. Your current session will end and you'll need to log in again.
        </p>
        <button
          type="button"
          onClick={handleSignOutAll}
          disabled={signingOut}
          className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign out from all devices
        </button>
      </div>

      {/* Danger */}
      <div className="rounded-xl border border-red-500/20 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger Zone</h2>
        </div>
        <p className="text-xs text-chalk-dim">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Account
        </button>
      </div>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
