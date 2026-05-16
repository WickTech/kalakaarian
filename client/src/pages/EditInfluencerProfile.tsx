import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, InfluencerProfile, UpdateInfluencerProfileData } from "@/lib/api";
import { CommercialsPricingSection } from "@/components/profile/CommercialsPricingSection";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [daysCount, setDaysCount] = useState<number | null>(null);
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

  const toggleNiche = (niche: string) => {
    setForm((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
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
      pricing: form.pricing,
    };

    setSaving(true);
    try {
      await api.updateInfluencerProfile(updateData);
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

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>

        {daysCount !== null && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-orange-300 w-fit">
            🔥 {daysCount} day{daysCount !== 1 ? "s" : ""} as a Kalakaar
          </div>
        )}

        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-chalk">Edit Kalakaar Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-7" onSubmit={handleSubmit}>

              {/* Personal Info */}
              <section className="space-y-3">
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
              <section className="space-y-3">
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
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-chalk">Niche / Category *</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {NICHE_OPTIONS.map((niche) => (
                    <label key={niche}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${
                        form.niches.includes(niche)
                          ? "border-purple-500/50 bg-purple-500/10 text-chalk"
                          : "border-white/10 text-chalk-dim hover:border-white/20"
                      }`}>
                      <Checkbox checked={form.niches.includes(niche)} onCheckedChange={() => toggleNiche(niche)} />
                      {niche}
                    </label>
                  ))}
                </div>
                {errors.niches && <p className="text-xs text-destructive">{errors.niches}</p>}
              </section>

              {/* Commercials */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-chalk">Commercials</h2>
                <p className="text-xs text-chalk-faint">Set your content pricing (brands will see these rates)</p>
                <CommercialsPricingSection pricing={form.pricing} onChange={handlePricingChange} />
              </section>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
