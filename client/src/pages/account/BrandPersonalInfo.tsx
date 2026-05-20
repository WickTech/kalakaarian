import { FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { keys } from '@/lib/queryKeys';

const CATEGORIES = ['Fashion','Technology','Food & Beverage','Health & Wellness','Finance','Entertainment','Retail','Education','Travel','Beauty','Other'];

export default function BrandPersonalInfo() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bName, setBName] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bIndustry, setBIndustry] = useState('');

  useEffect(() => {
    api.getBrandSettings().then(({ user: u, profile: p }) => {
      const bp = p as unknown as Record<string, string | undefined>;
      setBName(u.name || bp.contactPerson || '');
      setBEmail(u.email || bp.email || '');
      setBPhone(u.phone || bp.phone || '');
      setBIndustry(bp.industry || '');
    }).catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateBrandProfile({ companyName: bName, email: bEmail, phone: bPhone, industry: bIndustry });
      qc.invalidateQueries({ queryKey: keys.brand.profile() });
      toast({ title: 'Profile updated' });
    } catch { toast({ title: 'Save failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const field = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-chalk placeholder:text-chalk-dim focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors';

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide">Brand Details</h2>
        {([['Name', 'text', bName, setBName, 'Brand contact name'], ['Work Email', 'email', bEmail, setBEmail, 'work@brand.com'], ['Phone (WhatsApp)', 'tel', bPhone, setBPhone, '+91 9876543210']] as [string, string, string, (v: string) => void, string][]).map(([lbl, type, val, set, ph]) => (
          <div key={lbl} className="grid gap-1.5">
            <Label className="text-xs text-chalk-dim">{lbl}</Label>
            <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} className={field} />
          </div>
        ))}
        <div className="grid gap-1.5">
          <Label className="text-xs text-chalk-dim">Brand Category</Label>
          <Select value={bIndustry} onValueChange={setBIndustry}>
            <SelectTrigger className={field + ' flex'}><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-medium">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
      </Button>
    </form>
  );
}
