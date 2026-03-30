import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { InfluencerNiche } from "@/data/mockInfluencers";

const NICHE_OPTIONS: InfluencerNiche[] = [
  "Fashion",
  "Beauty",
  "Tech",
  "Travel",
  "Food",
  "Fitness",
  "Gaming",
  "Lifestyle",
  "Finance",
  "Other",
];

interface InfluencerRegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  bio: string;
  instagramHandle: string;
  youtubeUrl: string;
  niches: InfluencerNiche[];
  instagramFollowers: string;
  youtubeSubscribers: string;
  engagementRate: string;
}

interface InfluencerErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  bio?: string;
  social?: string;
  niches?: string;
}

export default function InfluencerRegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [errors, setErrors] = useState<InfluencerErrors>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<InfluencerRegisterFormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    bio: "",
    instagramHandle: "",
    youtubeUrl: "",
    niches: [],
    instagramFollowers: "",
    youtubeSubscribers: "",
    engagementRate: "",
  });

  const bioCount = useMemo(() => form.bio.length, [form.bio]);

  const toggleNiche = (niche: InfluencerNiche) => {
    setForm((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche) ? prev.niches.filter((item) => item !== niche) : [...prev.niches, niche],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: InfluencerErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full Name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!form.password.trim()) nextErrors.password = "Password is required.";
    if (!form.bio.trim()) nextErrors.bio = "Bio is required.";
    if (form.bio.length > 300) nextErrors.bio = "Bio cannot exceed 300 characters.";
    if (form.niches.length === 0) nextErrors.niches = "Please select at least one niche.";

    const hasSocial = [form.instagramHandle, form.youtubeUrl].some((value) => value.trim().length > 0);
    if (!hasSocial) nextErrors.social = "At least one social media handle is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await register({
        email: form.email,
        phone: form.phone,
        password: form.password,
        name: form.fullName,
        role: "influencer",
        niches: form.niches,
        platform: [
          ...(form.instagramHandle ? ["instagram"] : []),
          ...(form.youtubeUrl ? ["youtube"] : []),
        ],
        tier: "micro",
        bio: form.bio,
        socialHandles: {
          instagram: form.instagramHandle || undefined,
          youtube: form.youtubeUrl || undefined,
        },
        followers: {
          instagram: form.instagramFollowers ? Number(form.instagramFollowers) : undefined,
          youtube: form.youtubeSubscribers ? Number(form.youtubeSubscribers) : undefined,
        },
        engagementRate: form.engagementRate ? Number(form.engagementRate) : undefined,
      });
      navigate("/influencer/dashboard");
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Link to="/role-select" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">Influencer Registration</CardTitle>
            <CardDescription>Create your account and profile so brands can discover and collaborate with you.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-7" onSubmit={handleSubmit}>
              <section className="space-y-3">
                <h2 className="font-semibold">Account Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="+91 9876543210"
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Min 6 characters"
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Bio</h2>
                <div className="grid gap-2">
                  <Label htmlFor="bio">About You *</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    maxLength={300}
                    onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                    placeholder="Tell brands about your content style, audience, and strengths"
                  />
                  <p className="text-right text-xs text-muted-foreground">{bioCount}/300</p>
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Social Media Handles</h2>
                <p className="text-xs text-muted-foreground">At least one handle is required.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Instagram handle (e.g., @username)" value={form.instagramHandle} onChange={(event) => setForm((prev) => ({ ...prev, instagramHandle: event.target.value }))} />
                  <Input placeholder="YouTube channel URL" value={form.youtubeUrl} onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))} />
                </div>
                {errors.social && <p className="text-xs text-destructive">{errors.social}</p>}
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Niche / Category *</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {NICHE_OPTIONS.map((niche) => (
                    <label key={niche} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <Checkbox checked={form.niches.includes(niche)} onCheckedChange={() => toggleNiche(niche)} />
                      {niche}
                    </label>
                  ))}
                </div>
                {errors.niches && <p className="text-xs text-destructive">{errors.niches}</p>}
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Follower Count & Reach</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input type="number" min={0} placeholder="Instagram Followers" value={form.instagramFollowers} onChange={(event) => setForm((prev) => ({ ...prev, instagramFollowers: event.target.value }))} />
                  <Input type="number" min={0} placeholder="YouTube Subscribers" value={form.youtubeSubscribers} onChange={(event) => setForm((prev) => ({ ...prev, youtubeSubscribers: event.target.value }))} />
                  <div className="relative sm:col-span-2">
                    <Input type="number" min={0} step="0.01" placeholder="Average Engagement Rate (%)" value={form.engagementRate} onChange={(event) => setForm((prev) => ({ ...prev, engagementRate: event.target.value }))} className="pr-7" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </section>

              <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-95" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
