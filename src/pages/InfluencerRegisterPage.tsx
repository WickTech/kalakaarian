import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  bio: string;
  instagramHandle: string;
  youtubeUrl: string;
  tiktokHandle: string;
  twitterHandle: string;
  niches: InfluencerNiche[];
  instagramFollowers: string;
  youtubeSubscribers: string;
  tiktokFollowers: string;
  engagementRate: string;
}

export default function InfluencerRegisterPage() {
  const { toast } = useToast();
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<InfluencerRegisterFormData>({
    fullName: "",
    bio: "",
    instagramHandle: "",
    youtubeUrl: "",
    tiktokHandle: "",
    twitterHandle: "",
    niches: [],
    instagramFollowers: "",
    youtubeSubscribers: "",
    tiktokFollowers: "",
    engagementRate: "",
  });

  const bioCount = useMemo(() => form.bio.length, [form.bio]);

  const toggleNiche = (niche: InfluencerNiche) => {
    setForm((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche) ? prev.niches.filter((item) => item !== niche) : [...prev.niches, niche],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: string[] = [];
    if (!form.fullName.trim()) nextErrors.push("Full Name is required.");
    if (!form.bio.trim()) nextErrors.push("Bio is required.");
    if (form.bio.length > 300) nextErrors.push("Bio cannot exceed 300 characters.");
    if (form.niches.length === 0) nextErrors.push("Please select at least one niche.");

    const hasSocial = [form.instagramHandle, form.youtubeUrl, form.tiktokHandle, form.twitterHandle].some((value) => value.trim().length > 0);
    if (!hasSocial) nextErrors.push("Provide at least one social media handle.");

    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    toast({
      title: "Registration submitted",
      description: "Your influencer profile has been saved successfully.",
    });

    setForm({
      fullName: "",
      bio: "",
      instagramHandle: "",
      youtubeUrl: "",
      tiktokHandle: "",
      twitterHandle: "",
      niches: [],
      instagramFollowers: "",
      youtubeSubscribers: "",
      tiktokFollowers: "",
      engagementRate: "",
    });
  };

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">Influencer Registration</CardTitle>
            <CardDescription>Create your profile so brands can discover and collaborate with you.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-7" onSubmit={handleSubmit}>
              <section className="space-y-3">
                <h2 className="font-semibold">Personal Info</h2>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio *</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    maxLength={300}
                    onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                    placeholder="Tell brands about your content style, audience, and strengths"
                  />
                  <p className="text-right text-xs text-muted-foreground">{bioCount}/300</p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Social Media Handles</h2>
                <p className="text-xs text-muted-foreground">At least one handle is required.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Instagram handle" value={form.instagramHandle} onChange={(event) => setForm((prev) => ({ ...prev, instagramHandle: event.target.value }))} />
                  <Input placeholder="YouTube channel URL" value={form.youtubeUrl} onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))} />
                  <Input placeholder="TikTok handle" value={form.tiktokHandle} onChange={(event) => setForm((prev) => ({ ...prev, tiktokHandle: event.target.value }))} />
                  <Input placeholder="Twitter/X handle" value={form.twitterHandle} onChange={(event) => setForm((prev) => ({ ...prev, twitterHandle: event.target.value }))} />
                </div>
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
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Follower Count & Reach</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input type="number" min={0} placeholder="Instagram Followers" value={form.instagramFollowers} onChange={(event) => setForm((prev) => ({ ...prev, instagramFollowers: event.target.value }))} />
                  <Input type="number" min={0} placeholder="YouTube Subscribers" value={form.youtubeSubscribers} onChange={(event) => setForm((prev) => ({ ...prev, youtubeSubscribers: event.target.value }))} />
                  <Input type="number" min={0} placeholder="TikTok Followers" value={form.tiktokFollowers} onChange={(event) => setForm((prev) => ({ ...prev, tiktokFollowers: event.target.value }))} />
                  <div className="relative">
                    <Input type="number" min={0} step="0.01" placeholder="Average Engagement Rate" value={form.engagementRate} onChange={(event) => setForm((prev) => ({ ...prev, engagementRate: event.target.value }))} className="pr-7" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </section>

              {errors.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <ul className="list-disc space-y-1 pl-4">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Submit Registration
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
