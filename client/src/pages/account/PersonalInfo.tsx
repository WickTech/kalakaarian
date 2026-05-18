import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api, InfluencerProfile, UpdateInfluencerProfileData } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommercialsPricingSection } from '@/components/profile/CommercialsPricingSection';
import { SectionHeader } from './components/SectionHeader';

const NICHES = [
  'Fashion','Lifestyle','Gaming','Tech','Fitness','Food','Travel','Comedy',
  'Education','Finance','Beauty','Automotive','Music','Art','Sports','Dance',
  'Acting','Singing','Product Review','Photography & Videography','Art & Creativity',
  'Automobile & Mobility','Spiritual & Motivation','Regional & Cultural','Pets & Animals',
];
const CATEGORIES = ['Fashion','Technology','Food & Beverage','Health & Wellness','Finance','Entertainment','Retail','Education','Travel','Beauty','Other'];

function daysAge(iso?: string | null) {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export default function PersonalInfo() {
  const { user, isSuperAdmin, viewAs, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const role = isSuperAdmin ? (viewAs ?? user?.role) : user?.role;
  const isCreator = role === 'influencer';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Creator state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [ig, setIg] = useState('');
  const [yt, setYt] = useState('');
  const [niches, setNiches] = useState<string[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Brand state
  const [bName, setBName] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bIndustry, setBIndustry] = useState('');

  useEffect(() => {
    document.title = 'Personal Info — Kalakaarian';
    if (authLoading) return;
    setLoading(true);
    if (isCreator) {
      api.getInfluencerProfile().then((p: InfluencerProfile) => {
        setName(p.name ?? ''); setBio(p.bio ?? '');
        setCity(p.city ?? ''); setState(p.state ?? '');
        setIg((p.socialHandles?.instagram ?? '').replace(/^@/, ''));
        setYt((p.socialHandles?.youtube ?? '').replace(/^@/, ''));
        setNiches(p.niches ?? []);
        setPricing({ ...(p.pricing ?? {}) });
        setCreatedAt(p.createdAt ?? null);
      }).catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
        .finally(() => setLoading(false));
    } else {
      api.getBrandSettings().then(({ user: u, profile: p }) => {
        const bp = p as unknown as Record<string, string | undefined>;
        setBName(u.name || bp.contactPerson || '');
        setBEmail(u.email || bp.email || '');
        setBPhone(u.phone || bp.phone || '');
        setBIndustry(bp.industry || '');
      }).catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
        .finally(() => setLoading(false));
    }
  }, [authLoading, isCreator, toast]);

  const daysCount = useMemo(() => daysAge(createdAt), [createdAt]);
  const commercialsLocked = (daysCount ?? 0) < 180;
  const unlockDate = useMemo(() => createdAt ? new Date(new Date(createdAt).getTime() + 180 * 86_400_000) : null, [createdAt]);

  const handleCreatorSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    if (!bio.trim() || bio.length > 300) { toast({ title: 'Bio required (max 300 chars)', variant: 'destructive' }); return; }
    if (niches.length === 0) { toast({ title: 'Select at least one niche', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const update: UpdateInfluencerProfileData = {
        name, bio, city, state, niches,
        socialHandles: { instagram: ig || undefined, youtube: yt || undefined },
        ...(commercialsLocked ? {} : { pricing }),
      };
      await api.updateInfluencerProfile(update);
      qc.invalidateQueries({ queryKey: ['influencer-profile', user?.id] });
      qc.invalidateQueries({ queryKey: ['influencer-profile-own'] });
      toast({ title: 'Profile updated' });
    } catch { toast({ title: 'Save failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleBrandSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateBrandProfile({ companyName: bName, email: bEmail, phone: bPhone, industry: bIndustry });
      qc.invalidateQueries({ queryKey: ['brand-profile'] });
      toast({ title: 'Profile updated' });
    } catch { toast({ title: 'Save failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const field = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-chalk placeholder:text-chalk-dim focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors';

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Personal Info" subtitle="Edit your public-facing profile details" />

      {isCreator ? (
        <form onSubmit={handleCreatorSave} className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide">Basic Info</h2>
            <div className="grid gap-1.5">
              <Label>Full Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-[11px] text-chalk-faint">Change via Security settings</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" /></div>
              <div className="grid gap-1.5"><Label>State</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="State" /></div>
            </div>
            <div className="grid gap-1.5">
              <Label>Bio * <span className="text-chalk-faint font-normal">({bio.length}/300)</span></Label>
              <Textarea value={bio} maxLength={300} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell brands about your content style" />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide">Social Handles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {([['Instagram', ig, setIg], ['YouTube', yt, setYt]] as [string, string, (v: string) => void][]).map(([plat, val, set]) => (
                <div key={plat} className="grid gap-1.5">
                  <Label>{plat}</Label>
                  <div className="flex overflow-hidden rounded-md border border-input">
                    <span className="px-3 py-2 text-sm text-chalk-dim border-r border-input bg-white/5 shrink-0">@</span>
                    <Input value={val} onChange={e => set(e.target.value.replace(/^@/, ''))} placeholder="handle" className="border-0 focus-visible:ring-0 rounded-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide">Niche / Category *</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NICHES.map(n => (
                <label key={n} className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${niches.includes(n) ? 'border-purple-500/50 bg-purple-500/10 text-chalk' : 'border-white/10 text-chalk-dim hover:border-white/20'}`}>
                  <Checkbox checked={niches.includes(n)} onCheckedChange={() => setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])} />
                  {n}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <h2 className="text-xs font-semibold text-chalk uppercase tracking-wide">Commercials</h2>
            <p className="text-xs text-chalk-faint">
              {commercialsLocked
                ? `Pricing locked for 6 months${unlockDate ? ` — unlocks ${unlockDate.toLocaleDateString('en-IN')}` : ''}`
                : 'Set your content pricing visible to brands'}
            </p>
            <CommercialsPricingSection pricing={pricing} onChange={(k, v) => setPricing(p => ({ ...p, [k]: v }))} locked={commercialsLocked} unlockDate={unlockDate} />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleBrandSave} className="space-y-6">
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
      )}
    </div>
  );
}
