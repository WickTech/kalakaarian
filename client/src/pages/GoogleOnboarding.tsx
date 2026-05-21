import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import StepperNav from '@/components/creator-onboarding/StepperNav';
import StepBasicInfo from '@/components/creator-onboarding/StepBasicInfo';
import StepUsernameAvatar from '@/components/creator-onboarding/StepUsernameAvatar';
import StepGenre from '@/components/creator-onboarding/StepGenre';
import StepPlatforms from '@/components/creator-onboarding/StepPlatforms';
import StepRates from '@/components/creator-onboarding/StepRates';
import StepLocation from '@/components/creator-onboarding/StepLocation';
import { useCreatorForm } from '@/components/creator-onboarding/useCreatorForm';
import { STEPS } from '@/components/creator-onboarding/types';
import { avatarForGender } from '@/components/creator-onboarding/genericAvatars';
import { BRAND_INDUSTRIES } from '@/lib/industries';

const USER_KEY = 'kalakariaan_user';

export default function GoogleOnboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'brand' | 'influencer'>('brand');

  // Brand state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [website, setWebsite] = useState('');

  // Creator state (uses shared step components)
  const { form, setField, onInput, toggleGenre, validateStep } = useCreatorForm({
    name: user?.name ?? '',
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'brand' || user?.role === 'influencer') setRole(user.role);
  }, [user]);

  useEffect(() => {
    if (user?.name && !form.name) setField('name', user.name);
  }, [user, form.name, setField]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted !== false) return <Navigate to="/" replace />;

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName.trim() || !industry) { setError('Company name and industry are required.'); return; }
    if (industry === 'Other' && !customIndustry.trim()) { setError('Please enter your industry.'); return; }
    setSubmitting(true);
    try {
      const response = await api.completeGoogleOnboarding({
        role: 'brand',
        companyName: companyName.trim(),
        industry: industry === 'Other' ? customIndustry.trim() : industry,
        website: website.trim() || undefined,
      });
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      window.location.href = '/brand/welcome';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete onboarding.');
      setSubmitting(false);
    }
  };

  const next = () => {
    const err = validateStep(step, true);
    if (err) { setError(err); return; }
    setError(''); setStep(s => s + 1);
  };
  const back = () => { setError(''); setStep(s => s - 1); };

  const handleCreatorSubmit = async () => {
    const err = validateStep(5, true);
    if (err) { setError(err); return; }
    setSubmitting(true);
    try {
      const profileImage = form.profileImage || avatarForGender(form.gender);
      const response = await api.completeGoogleOnboarding({
        role: 'influencer',
        phone: form.phone,
        username: form.username,
        gender: form.gender || undefined,
        bio: form.bio,
        city: form.city,
        state: form.state,
        niches: form.genres,
        platform: [...(form.instagram ? ['instagram'] : []), ...(form.youtube ? ['youtube'] : [])],
        instagramHandle: form.instagram || undefined,
        youtubeHandle: form.youtube || undefined,
        profileImageUrl: profileImage.startsWith('data:') ? undefined : profileImage,
        pricing: {
          reelRate: Number(form.reelRate) || 0,
          storyRate: Number(form.storyRate) || 0,
          longVideoRate: Number(form.longVideoRate) || 0,
          shortsRate: Number(form.shortsRate) || 0,
        },
      });

      // Upload user-supplied image (data URL) post-onboarding
      if (form.profileImage && form.profileImage.startsWith('data:')) {
        try {
          const [meta, b64] = form.profileImage.split(',');
          const mime = meta.match(/data:(.*?);/)?.[1] as 'image/png' | 'image/jpeg' | 'image/webp' | undefined;
          if (mime && b64) await api.updateAvatar(b64, mime);
        } catch { /* non-fatal */ }
      }

      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      window.location.href = `/influencer/${response.user.id}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete onboarding.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-obsidian px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-chalk mb-2">Finish setting up your account</h1>
        <p className="text-sm text-chalk-dim mb-6">A few quick details so we can show you the right experience.</p>

        <div className="bento-card p-5 mb-5">
          <label className="block text-sm text-chalk-dim mb-1.5">I am a *</label>
          <div className="flex rounded-full border border-white/10 overflow-hidden text-xs">
            {(['brand', 'influencer'] as const).map(r => (
              <button type="button" key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 font-medium capitalize ${role === r ? 'bg-white/10 text-chalk' : 'text-chalk-dim'}`}>
                {r === 'brand' ? 'Brand' : 'Creator'}
              </button>
            ))}
          </div>
        </div>

        {role === 'brand' ? (
          <form onSubmit={handleBrandSubmit} className="bento-card p-6 space-y-5">
            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Company Name *</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="dark-input w-full px-4 py-3 text-sm" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Industry *</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} className="dark-select w-full px-4 py-3 text-sm">
                <option value="">Select your industry</option>
                {BRAND_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              {industry === 'Other' && (
                <input value={customIndustry} onChange={e => setCustomIndustry(e.target.value)}
                  className="dark-input w-full px-4 py-3 text-sm mt-2" placeholder="Type your industry" />
              )}
            </div>
            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Brand Website</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                className="dark-input w-full px-4 py-3 text-sm" placeholder="https://acme.com" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={submitting} className="purple-pill w-full py-3 text-sm disabled:opacity-50">
              {submitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        ) : (
          <div className="grid md:grid-cols-[200px_1fr] gap-6">
            <StepperNav steps={STEPS} current={step} onSelect={setStep} />
            <div className="bento-card p-6">
              {step === 0 && <StepBasicInfo form={form} onInput={onInput} googleMode />}
              {step === 1 && <StepUsernameAvatar form={form} setField={setField} />}
              {step === 2 && <StepGenre form={form} toggleGenre={toggleGenre} />}
              {step === 3 && <StepPlatforms form={form} setField={setField} onInput={onInput} />}
              {step === 4 && <StepRates form={form} onInput={onInput} />}
              {step === 5 && <StepLocation form={form} onInput={onInput} />}

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button onClick={back} className="flex-1 py-3 text-sm rounded-full border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
                    Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button onClick={next} className="flex-1 purple-pill py-3 text-sm">Continue →</button>
                ) : (
                  <button onClick={handleCreatorSubmit} disabled={submitting} className="flex-1 gold-pill py-3 text-sm disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Complete Setup ✓'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
