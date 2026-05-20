import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, User, Share2, Tags, IndianRupee, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, InfluencerProfile, UpdateInfluencerProfileData } from "@/lib/api";
import { CommercialsPricingSection } from "@/components/profile/CommercialsPricingSection";
import { keys } from '@/lib/queryKeys';

const NICHE_OPTIONS = [
  "Fashion", "Lifestyle", "Gaming", "Tech", "Fitness", "Food", "Travel", "Comedy",
  "Education", "Finance", "Beauty", "Automotive", "Music", "Art", "Sports", "Dance",
  "Acting", "Singing", "Product Review", "Photography & Videography", "Art & Creativity",
  "Automobile & Mobility", "Spiritual & Motivation", "Regional & Cultural", "Pets & Animals",
];

interface FormData {
  fullName: string;
  bio: string;
  city: string;
  state: string;
  instagramHandle: string;
  youtubeHandle: string;
  niches: string[];
  pricing: Record<string, number>;
}

interface FormErrors {
  fullName?: string;
  bio?: string;
  niches?: string;
}

function daysAsKalakaar(createdAt?: string | null): number | null {
  if (!createdAt) return null;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export default function EditInfluencerProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [daysCount, setDaysCount] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    fullName: "", bio: "", city: "", state: "",
    instagramHandle: "", youtubeHandle: "",
    niches: [], pricing: {},
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const profile: InfluencerProfile = await api.getInfluencerProfile();
        setDaysCount(daysAsKalakaar(profile.createdAt));
        setCreatedAt(profile.createdAt ?? null);
        setForm({
          fullName: profile.name || "",
          bio: profile.bio || "",
          city: profile.city || "",
          state: profile.state || "",
          instagramHandle: (profile.socialHandles?.instagram || "").replace(/^@/, ""),
          youtubeHandle: (profile.socialHandles?.youtube || "").replace(/^@/, ""),
          niches: profile.niches || [],
          pricing: { ...(profile.pricing || {}) },
        });
      } catch {
        toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [toast]);

  const bioCount = useMemo(() => form.bio.length, [form.bio]);

  const commercialsLocked = (daysCount ?? 0) < 180;
  const unlockDate = useMemo(() => {
    if (!createdAt) return null;
    return new Date(new Date(createdAt).getTime() + 180 * 86_400_000);
  }, [createdAt]);

  const MAX_NICHES = 3;
  const toggleNiche = (niche: string) => {
    setForm((prev) => {
      if (prev.niches.includes(niche)) return { ...prev, niches: prev.niches.filter((n) => n !== niche) };
      if (prev.niches.length >= MAX_NICHES) return prev;
      return { ...prev, niches: [...prev.niches, niche] };
    });
  };

  const handlePricingChange = (key: string, value: number) => {
    setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.bio.trim()) nextErrors.bio = "Bio is required.";
    if (form.bio.length > 300) nextErrors.bio = "Bio cannot exceed 300 characters.";
    if (form.niches.length === 0) nextErrors.niches = "Select at least one niche.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const updateData: UpdateInfluencerProfileData = {
      name: form.fullName,
      bio: form.bio,
      city: form.city,
      state: form.state,
      niches: form.niches,
      socialHandles: {
        instagram: form.instagramHandle.replace(/^@/, "") || undefined,
        youtube: form.youtubeHandle.replace(/^@/, "") || undefined,
      },
      // Omit pricing when locked — server enforces 6-month rule too
      ...(commercialsLocked ? {} : { pricing: form.pricing }),
    };

    setSaving(true);
    try {
      await api.updateInfluencerProfile(updateData);
      qc.invalidateQueries({ queryKey: keys.creators.profile(user?.id) });
      qc.invalidateQueries({ queryKey: keys.creators.profileOwn() });
      toast({ title: "Profile updated" });
      navigate("/profile");
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "social", label: "Social Media", icon: Share2 },
    { id: "niche", label: "Niche / Category", icon: Tags },
    { id: "commercials", label: "Commercials", icon: IndianRupee, locked: commercialsLocked },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>

        {daysCount !== null && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-orange-300 w-fit">
            🔥 {daysCount} day{daysCount !== 1 ? "s" : ""} as a Kalakaar
          </div>
        )}

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          <aside className="md:sticky md:top-20 self-start">
            <nav className="space-y-1 p-2 rounded-xl border border-white/10 bg-white/[0.02]">
              {navItems.map(({ id, label, icon: Icon, locked }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                  {locked && <Lock className="w-3 h-3 text-chalk-faint" />}
                </a>
              ))}
            </nav>
          </aside>

          <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-chalk">Edit Kalakaar Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-7" onSubmit={handleSubmit}>

              {/* Personal Info */}
              <section id="personal" className="space-y-3 scroll-mt-20">
                <h2 className="text-sm font-semibold text-chalk">Personal Info</h2>

                <div className="grid gap-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name" />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled
                    className="opacity-60 cursor-not-allowed" />
                  <p className="text-[11px] text-chalk-faint">Change email via account settings</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Your city" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={form.state}
                      onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="Your state" />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bio">Bio *</Label>
                  <Textarea id="bio" value={form.bio} maxLength={300}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell brands about your content style and strengths" rows={3} />
                  <p className="text-right text-xs text-chalk-faint">{bioCount}/300</p>
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
                </div>
              </section>

              {/* Social Media Handles */}
              <section id="social" className="space-y-3 scroll-mt-20">
                <h2 className="text-sm font-semibold text-chalk">Social Media</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>Instagram</Label>
                    <div className="flex items-center gap-0 overflow-hidden rounded-md border border-input">
                      <span className="px-3 py-2 text-sm text-chalk-dim border-r border-input bg-white/5 shrink-0">@</span>
                      <Input
                        value={form.instagramHandle}
                        onChange={(e) => setForm((p) => ({ ...p, instagramHandle: e.target.value.replace(/^@/, "") }))}
                        placeholder="kalakaarian"
                        className="border-0 focus-visible:ring-0 rounded-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>YouTube</Label>
                    <div className="flex items-center gap-0 overflow-hidden rounded-md border border-input">
                      <span className="px-3 py-2 text-sm text-chalk-dim border-r border-input bg-white/5 shrink-0">@</span>
                      <Input
                        value={form.youtubeHandle}
                        onChange={(e) => setForm((p) => ({ ...p, youtubeHandle: e.target.value.replace(/^@/, "") }))}
                        placeholder="kalakaarian"
                        className="border-0 focus-visible:ring-0 rounded-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Niche / Category */}
              <section id="niche" className="space-y-3 scroll-mt-20">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-chalk">Niche / Category *</h2>
                  <span className={`text-xs ${form.niches.length >= MAX_NICHES ? 'text-purple-400 font-semibold' : 'text-chalk-faint'}`}>
                    ({form.niches.length}/{MAX_NICHES} max)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {NICHE_OPTIONS.map((niche) => {
                    const checked = form.niches.includes(niche);
                    const capped = form.niches.length >= MAX_NICHES && !checked;
                    return (
                      <label key={niche}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                          checked
                            ? "border-purple-500/50 bg-purple-500/10 text-chalk cursor-pointer"
                            : capped
                            ? "border-white/5 text-chalk-faint opacity-40 cursor-not-allowed"
                            : "border-white/10 text-chalk-dim hover:border-white/20 cursor-pointer"
                        }`}>
                        <Checkbox checked={checked} disabled={capped} onCheckedChange={() => !capped && toggleNiche(niche)} />
                        {niche}
                      </label>
                    );
                  })}
                </div>
                {errors.niches && <p className="text-xs text-destructive">{errors.niches}</p>}
              </section>

              {/* Commercials */}
              <section id="commercials" className="space-y-3 scroll-mt-20">
                <h2 className="text-sm font-semibold text-chalk flex items-center gap-2">
                  Commercials
                  {commercialsLocked && <Lock className="w-3.5 h-3.5 text-chalk-faint" />}
                </h2>
                <p className="text-xs text-chalk-faint">
                  {commercialsLocked
                    ? `Pricing locks for 6 months from registration${unlockDate ? ` — unlocks on ${unlockDate.toLocaleDateString("en-IN")}` : ""}.`
                    : "Set your content pricing (brands will see these rates)"}
                </p>
                <CommercialsPricingSection
                  pricing={form.pricing}
                  onChange={handlePricingChange}
                  locked={commercialsLocked}
                  unlockDate={unlockDate}
                />
              </section>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}
