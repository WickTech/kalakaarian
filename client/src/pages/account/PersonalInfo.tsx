import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FormRowSkeleton } from '@/components/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api, InfluencerProfile } from '@/lib/api';
import { InlineEditField } from '@/components/account/InlineEditField';
import { SectionHeader } from './components/SectionHeader';
import { NICHE_OPTIONS, GENDER_OPTIONS, genderLabel } from './personalInfoFields';
import BrandPersonalInfo from './BrandPersonalInfo';
import { CommercialsView } from './CommercialsView';
import { keys } from '@/lib/queryKeys';

export default function PersonalInfo() {
  const { user, isSuperAdmin, viewAs, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const role = isSuperAdmin ? (viewAs ?? user?.role) : user?.role;
  const isCreator = role === 'influencer';
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Personal Info — Kalakaarian';
    if (authLoading || !isCreator) { if (!isCreator) setLoading(false); return; }
    setLoading(true);
    api.getInfluencerProfile()
      .then(p => setProfile(p))
      .catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [authLoading, isCreator, toast]);

  const daysCount = useMemo(() => {
    if (!profile?.createdAt) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86_400_000));
  }, [profile?.createdAt]);
  const commercialsLocked = (daysCount ?? 0) < 180;

  if (!isCreator) return (
    <div className="space-y-6">
      <SectionHeader title="Personal Info" subtitle="Edit your public-facing profile details" />
      <BrandPersonalInfo />
    </div>
  );

  if (loading || !profile) return (
    <div className="bento-card p-2">
      {Array.from({ length: 6 }).map((_, i) => <FormRowSkeleton key={i} />)}
    </div>
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: keys.creators.profileOwn() });
    qc.invalidateQueries({ queryKey: keys.creators.profile(user?.id) });
    qc.invalidateQueries({ queryKey: keys.creators.all });
  };

  const save = async (patch: Record<string, unknown>) => {
    const updated = await api.updateInfluencerProfile(patch);
    setProfile(prev => prev ? { ...prev, ...updated } : updated);
    invalidate();
  };

  const saveAvatar = async (base64: string) => {
    const match = base64.match(/^data:([^;]+);base64,/);
    const mime = match?.[1] || 'image/jpeg';
    const { avatarUrl } = await api.updateAvatar(base64, mime);
    setProfile(prev => prev ? { ...prev, profileImage: avatarUrl } : prev);
    invalidate();
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Personal Info" subtitle="Tap the pencil on any field to edit. Saves sync everywhere instantly." />

      <div className="grid gap-3">
        <InlineEditField label="Profile Image" type="image" value={profile.profileImage ?? ''}
          display={v => v ? <img src={v as string} alt="" className="w-16 h-16 rounded-full object-cover border border-white/10" /> : <span className="text-chalk-faint">No image</span>}
          onSave={async (v) => saveAvatar(v as string)} />

        <InlineEditField label="Full Name" value={profile.name ?? ''} placeholder="Your full name"
          onSave={async (v) => save({ name: String(v).trim() })} />

        <InlineEditField label="Username" value={profile.username ?? ''} placeholder="unique handle (letters, numbers)"
          hint="⚡ This is your public identity on Kalakaarian — brands see, search, and recognise you by this name. Pick something unique that represents you."
          onSave={async (v) => save({ username: String(v).trim().toLowerCase() })} />

        <InlineEditField label="Email" value={user?.email ?? ''} disabled hint="Change via Security settings" onSave={async () => {}} />

        <InlineEditField label="Phone (WhatsApp)" value={profile.phone ?? ''} placeholder="+91 9876543210"
          onSave={async (v) => save({ phone: String(v) })} />

        <InlineEditField label="Gender" type="select" value={profile.gender ?? ''} options={GENDER_OPTIONS}
          display={v => genderLabel(String(v))}
          onSave={async (v) => save({ gender: String(v) })} />

        <InlineEditField label="Bio" type="textarea" value={profile.bio ?? ''} maxLength={150}
          placeholder="Tell brands about your content style"
          onSave={async (v) => save({ bio: String(v) })} />

        <InlineEditField label="City" value={profile.city ?? ''} placeholder="Mumbai"
          onSave={async (v) => save({ city: String(v) })} />

        <InlineEditField label="State" value={profile.state ?? ''} placeholder="Maharashtra"
          onSave={async (v) => save({ state: String(v) })} />

        <InlineEditField label="Instagram Handle" value={(profile.socialHandles?.instagram ?? '').replace(/^@/, '')}
          placeholder="yourhandle"
          display={v => v ? `@${v}` : '—'}
          onSave={async (v) => save({ socialHandles: { instagram: String(v).replace(/^@/, ''), youtube: profile.socialHandles?.youtube } })} />

        <InlineEditField label="YouTube Handle" value={(profile.socialHandles?.youtube ?? '').replace(/^@/, '')}
          placeholder="yourchannel"
          display={v => v ? `@${v}` : '—'}
          onSave={async (v) => save({ socialHandles: { instagram: profile.socialHandles?.instagram, youtube: String(v).replace(/^@/, '') } })} />

        <InlineEditField label="Niches" type="multiselect" value={profile.niches ?? []} options={NICHE_OPTIONS}
          onSave={async (v) => save({ niches: v as string[] })} />

        <CommercialsView profile={profile} commercialsLocked={commercialsLocked} />
      </div>
    </div>
  );
}
