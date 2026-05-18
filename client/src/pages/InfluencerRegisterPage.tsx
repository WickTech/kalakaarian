import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { TermsModal } from '@/components/TermsModal';
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
import { api } from '@/lib/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const showGoogle = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com';

export default function InfluencerRegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const { form, setField, onInput, toggleGenre, validateStep } = useCreatorForm();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const next = () => {
    const err = validateStep(step, false);
    if (err) { setError(err); return; }
    setError(''); setStep(s => s + 1);
  };
  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const err = validateStep(5, false);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const profileImage = form.profileImage || avatarForGender(form.gender);
      let finalImage = profileImage;
      await register({
        email: form.email, phone: form.phone, password: form.password, name: form.name,
        username: form.username,
        role: 'influencer',
        gender: form.gender || undefined,
        niches: form.genres,
        platform: [...(form.instagram ? ['instagram'] : []), ...(form.youtube ? ['youtube'] : [])],
        tier: 'micro', bio: form.bio,
        socialHandles: { instagram: form.instagram || undefined, youtube: form.youtube || undefined },
        profileImage: finalImage, city: form.city,
        pricing: {
          reelRate: Number(form.reelRate) || 0,
          storyRate: Number(form.storyRate) || 0,
          longVideoRate: Number(form.longVideoRate) || 0,
          shortsRate: Number(form.shortsRate) || 0,
        },
        termsAccepted: true,
      });

      // Upload custom avatar if a data URL was provided
      if (form.profileImage && form.profileImage.startsWith('data:')) {
        try {
          const [meta, b64] = form.profileImage.split(',');
          const mime = meta.match(/data:(.*?);/)?.[1] as 'image/png' | 'image/jpeg' | 'image/webp' | undefined;
          if (mime && b64) {
            const r = await api.updateAvatar(b64, mime);
            finalImage = r.avatarUrl;
          }
        } catch { /* non-fatal */ }
      }

      // Persist Instagram/YouTube handles + state via updateInfluencerProfile
      try {
        await api.updateInfluencerProfile({
          state: form.state,
          socialHandles: {
            instagram: form.instagram || undefined,
            youtube: form.youtube || undefined,
          },
        });
      } catch { /* non-fatal */ }

      const stored = localStorage.getItem('kalakariaan_user');
      const u = stored ? JSON.parse(stored) : null;
      navigate(u?.id ? `/influencer/${u.id}` : '/influencer/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (cr: { credential?: string }) => {
    if (!cr.credential) return;
    setLoading(true);
    try {
      const result = await loginWithGoogle(cr.credential, 'influencer');
      if (result.needsOnboarding) { navigate('/register/complete'); return; }
      const stored = localStorage.getItem('kalakariaan_user');
      const u = stored ? JSON.parse(stored) : null;
      navigate(u?.id ? `/influencer/${u.id}` : '/influencer/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-obsidian overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-fuchsia-600/5 to-pink-600/10 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/login" className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          <StepperNav steps={STEPS} current={step} onSelect={setStep} />

          <div className="bento-card p-6">
            {step === 0 && (
              <>
                {showGoogle && (
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-center">
                      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in failed')}
                        text="signup_with" shape="pill" theme="filled_black" size="large" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-chalk-faint">or fill in your details</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  </div>
                )}
                <StepBasicInfo form={form} onInput={onInput} />
              </>
            )}
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
                <button onClick={() => setShowTerms(true)} disabled={loading} className="flex-1 gold-pill py-3 text-sm disabled:opacity-50">
                  {loading ? 'Creating Account...' : 'Complete Profile ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTerms && (
        <TermsModal
          onAccept={() => { setShowTerms(false); handleSubmit(); }}
          onClose={() => setShowTerms(false)}
        />
      )}
    </main>
  );
}
