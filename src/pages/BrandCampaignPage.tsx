import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockInfluencers, InfluencerNiche, RegisteredInfluencer } from "@/data/mockInfluencers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

const MIN_FOLLOWER_OPTIONS = ["1K+", "10K+", "50K+", "100K+", "500K+"] as const;
const PLATFORM_OPTIONS = ["Instagram", "YouTube", "TikTok", "Twitter/X"] as const;

type MinFollowerOption = (typeof MIN_FOLLOWER_OPTIONS)[number];
type PlatformOption = (typeof PLATFORM_OPTIONS)[number];

interface BrandCampaignFormData {
  companyName: string;
  industry: string;
  email: string;
  campaignName: string;
  campaignGoal: string;
  campaignDescription: string;
  budgetRange: string;
  startDate: string;
  endDate: string;
  preferredNiches: InfluencerNiche[];
  minimumFollowers: MinFollowerOption | "";
  preferredPlatforms: PlatformOption[];
}

const minFollowerThreshold: Record<MinFollowerOption, number> = {
  "1K+": 1_000,
  "10K+": 10_000,
  "50K+": 50_000,
  "100K+": 100_000,
  "500K+": 500_000,
};

const getTopPlatform = (influencer: RegisteredInfluencer) => {
  const stats = [
    { platform: "Instagram", count: influencer.instagramFollowers ?? 0 },
    { platform: "YouTube", count: influencer.youtubeSubscribers ?? 0 },
    { platform: "TikTok", count: influencer.tiktokFollowers ?? 0 },
  ];

  return stats.sort((a, b) => b.count - a.count)[0];
};

const formatFollowers = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return `${count}`;
};

export default function BrandCampaignPage() {
  const { toast } = useToast();

  const [showInfluencers, setShowInfluencers] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<BrandCampaignFormData>({
    companyName: "",
    industry: "",
    email: "",
    campaignName: "",
    campaignGoal: "",
    campaignDescription: "",
    budgetRange: "",
    startDate: "",
    endDate: "",
    preferredNiches: [],
    minimumFollowers: "",
    preferredPlatforms: [],
  });

  const filteredInfluencers = useMemo(() => {
    const minimumThreshold = form.minimumFollowers ? minFollowerThreshold[form.minimumFollowers] : 0;

    return mockInfluencers.filter((influencer) => {
      const topPlatform = getTopPlatform(influencer);
      const byNiche = form.preferredNiches.length === 0 || influencer.niches.some((niche) => form.preferredNiches.includes(niche));
      const byFollowers = topPlatform.count >= minimumThreshold;
      return byNiche && byFollowers;
    });
  }, [form.minimumFollowers, form.preferredNiches]);

  const toggleNiche = (niche: InfluencerNiche) => {
    setForm((prev) => ({
      ...prev,
      preferredNiches: prev.preferredNiches.includes(niche) ? prev.preferredNiches.filter((item) => item !== niche) : [...prev.preferredNiches, niche],
    }));
  };

  const togglePlatform = (platform: PlatformOption) => {
    setForm((prev) => ({
      ...prev,
      preferredPlatforms: prev.preferredPlatforms.includes(platform)
        ? prev.preferredPlatforms.filter((item) => item !== platform)
        : [...prev.preferredPlatforms, platform],
    }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: string[] = [];

    if (!form.companyName.trim()) nextErrors.push("Brand / Company Name is required.");
    if (!form.industry) nextErrors.push("Industry is required.");
    if (!form.email.trim()) nextErrors.push("Contact Email is required.");
    if (!form.campaignName.trim()) nextErrors.push("Campaign Name is required.");
    if (!form.campaignGoal) nextErrors.push("Campaign Goal is required.");
    if (!form.campaignDescription.trim()) nextErrors.push("Campaign Description is required.");
    if (form.campaignDescription.length > 500) nextErrors.push("Campaign Description cannot exceed 500 characters.");
    if (!form.budgetRange) nextErrors.push("Budget Range is required.");
    if (!form.startDate || !form.endDate) nextErrors.push("Campaign Start and End Date are required.");
    if (form.preferredPlatforms.length === 0) nextErrors.push("Select at least one preferred platform.");
    if (!form.minimumFollowers) nextErrors.push("Minimum follower count is required.");

    setErrors(nextErrors);
    if (nextErrors.length > 0) {
      setShowInfluencers(false);
      return;
    }

    toast({
      title: "Campaign created",
      description: "Your campaign has been saved. Matching influencers are shown below.",
    });

    setShowInfluencers(true);
  };

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">Brand Campaign Creation</CardTitle>
            <CardDescription>Set campaign goals and discover matching influencers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-7" onSubmit={onSubmit}>
              <section className="space-y-3">
                <h2 className="font-semibold">Brand Info</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Brand / Company Name *</Label>
                    <Input id="companyName" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry *</Label>
                    <Select value={form.industry} onValueChange={(value) => setForm((prev) => ({ ...prev, industry: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Tech">Tech</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Contact Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Campaign Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input id="campaignName" value={form.campaignName} onChange={(event) => setForm((prev) => ({ ...prev, campaignName: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign Goal *</Label>
                    <Select value={form.campaignGoal} onValueChange={(value) => setForm((prev) => ({ ...prev, campaignGoal: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Brand Awareness">Brand Awareness</SelectItem>
                        <SelectItem value="Product Launch">Product Launch</SelectItem>
                        <SelectItem value="Lead Generation">Lead Generation</SelectItem>
                        <SelectItem value="Sales/Conversions">Sales/Conversions</SelectItem>
                        <SelectItem value="Event Promotion">Event Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Range *</Label>
                    <Select value={form.budgetRange} onValueChange={(value) => setForm((prev) => ({ ...prev, budgetRange: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<$500">&lt;$500</SelectItem>
                        <SelectItem value="$500–$2000">$500–$2000</SelectItem>
                        <SelectItem value="$2000–$10000">$2000–$10000</SelectItem>
                        <SelectItem value="$10000+">$10000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="campaignDescription">Campaign Description *</Label>
                    <Textarea
                      id="campaignDescription"
                      maxLength={500}
                      value={form.campaignDescription}
                      onChange={(event) => setForm((prev) => ({ ...prev, campaignDescription: event.target.value }))}
                    />
                    <p className="text-right text-xs text-muted-foreground">{form.campaignDescription.length}/500</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Campaign Start Date *</Label>
                    <Input id="startDate" type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Campaign End Date *</Label>
                    <Input id="endDate" type="date" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Influencer Preferences</h2>
                <div className="space-y-2">
                  <Label>Preferred Niche</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {NICHE_OPTIONS.map((niche) => (
                      <label key={niche} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                        <Checkbox checked={form.preferredNiches.includes(niche)} onCheckedChange={() => toggleNiche(niche)} />
                        {niche}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Minimum Follower Count Required *</Label>
                    <Select
                      value={form.minimumFollowers}
                      onValueChange={(value: MinFollowerOption) => setForm((prev) => ({ ...prev, minimumFollowers: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select minimum followers" />
                      </SelectTrigger>
                      <SelectContent>
                        {MIN_FOLLOWER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Platforms *</Label>
                    <div className="space-y-2 rounded-md border p-3">
                      {PLATFORM_OPTIONS.map((platform) => (
                        <label key={platform} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={form.preferredPlatforms.includes(platform)} onCheckedChange={() => togglePlatform(platform)} />
                          {platform}
                        </label>
                      ))}
                    </div>
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

              <Button type="submit" className="w-full">
                Create Campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        {showInfluencers && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Matching Influencers</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredInfluencers.map((influencer) => {
                const topPlatform = getTopPlatform(influencer);
                return (
                  <Card key={influencer.id}>
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-lg">{influencer.fullName}</CardTitle>
                      <CardDescription>{influencer.bio.length > 110 ? `${influencer.bio.slice(0, 110)}...` : influencer.bio}</CardDescription>
                      <div className="flex flex-wrap gap-2">
                        {influencer.niches.map((niche) => (
                          <Badge variant="secondary" key={`${influencer.id}-${niche}`}>
                            {niche}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Top Platform: <span className="font-medium text-foreground">{topPlatform.platform}</span> · {formatFollowers(topPlatform.count)} followers
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Invite to Campaign
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
            {filteredInfluencers.length === 0 && (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  No influencers match the selected niche and follower threshold.
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
