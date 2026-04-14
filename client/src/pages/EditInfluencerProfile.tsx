import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, InfluencerProfile, UpdateInfluencerProfileData } from "@/lib/api";

const NICHE_OPTIONS = [
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

interface FormData {
  fullName: string;
  bio: string;
  city: string;
  instagramHandle: string;
  youtubeHandle: string;
  niches: string[];
  instagramFollowers: string;
  youtubeFollowers: string;
  engagementRate: string;
}

interface FormErrors {
  fullName?: string;
  bio?: string;
  niches?: string;
}

interface InstagramPost {
  url: string;
  thumbnail?: string;
  caption?: string;
}

interface YouTubeVideo {
  url: string;
  thumbnail?: string;
  title?: string;
}

export default function EditInfluencerProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [youtubeVideos, setYouTubeVideos] = useState<YouTubeVideo[]>([]);
  const [newInstagramUrl, setNewInstagramUrl] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [form, setForm] = useState<FormData>({
    fullName: "",
    bio: "",
    city: "",
    instagramHandle: "",
    youtubeHandle: "",
    niches: [],
    instagramFollowers: "",
    youtubeFollowers: "",
    engagementRate: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile: InfluencerProfile = await api.getInfluencerProfile();
        setForm({
          fullName: profile.name || "",
          bio: profile.bio || "",
          city: profile.city || "",
          instagramHandle: profile.socialHandles?.instagram || "",
          youtubeHandle: profile.socialHandles?.youtube || "",
          niches: profile.niches || [],
          instagramFollowers: profile.followers?.instagram?.toString() || "",
          youtubeFollowers: profile.followers?.youtube?.toString() || "",
          engagementRate: profile.engagementRate?.toString() || "",
        });
        setInstagramPosts(profile.instagramPosts || []);
        setYouTubeVideos(profile.youtubeVideos || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const bioCount = useMemo(() => form.bio.length, [form.bio]);

  const toggleNiche = (niche: string) => {
    setForm((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((item) => item !== niche)
        : [...prev.niches, niche],
    }));
  };

  const addInstagramPost = () => {
    if (newInstagramUrl.trim()) {
      setInstagramPosts((prev) => [...prev, { url: newInstagramUrl.trim() }]);
      setNewInstagramUrl("");
    }
  };

  const removeInstagramPost = (index: number) => {
    setInstagramPosts((prev) => prev.filter((_, i) => i !== index));
  };

  const addYouTubeVideo = () => {
    if (newYoutubeUrl.trim()) {
      setYouTubeVideos((prev) => [...prev, { url: newYoutubeUrl.trim() }]);
      setNewYoutubeUrl("");
    }
  };

  const removeYouTubeVideo = (index: number) => {
    setYouTubeVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full Name is required.";
    if (!form.bio.trim()) nextErrors.bio = "Bio is required.";
    if (form.bio.length > 300) nextErrors.bio = "Bio cannot exceed 300 characters.";
    if (form.niches.length === 0) nextErrors.niches = "Please select at least one niche.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const updateData: UpdateInfluencerProfileData = {
      name: form.fullName,
      bio: form.bio,
      city: form.city,
      niches: form.niches,
      socialHandles: {
        instagram: form.instagramHandle || undefined,
        youtube: form.youtubeHandle || undefined,
      },
      followers: {
        instagram: form.instagramFollowers ? parseInt(form.instagramFollowers) : undefined,
        youtube: form.youtubeFollowers ? parseInt(form.youtubeFollowers) : undefined,
      },
      engagementRate: form.engagementRate ? parseFloat(form.engagementRate) : undefined,
      instagramPosts,
      youtubeVideos,
    };

    setSaving(true);
    try {
      await api.updateInfluencerProfile(updateData);
      toast({
        title: "Profile updated",
        description: "Your influencer profile has been saved successfully.",
      });
      navigate("/profile");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">Edit Influencer Profile</CardTitle>
            <CardDescription>Update your profile information.</CardDescription>
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
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
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
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    placeholder="Your city"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Social Media Handles</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Instagram handle (e.g., @username)"
                    value={form.instagramHandle}
                    onChange={(event) => setForm((prev) => ({ ...prev, instagramHandle: event.target.value }))}
                  />
                  <Input
                    placeholder="YouTube channel URL"
                    value={form.youtubeHandle}
                    onChange={(event) => setForm((prev) => ({ ...prev, youtubeHandle: event.target.value }))}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Niche / Category *</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {NICHE_OPTIONS.map((niche) => (
                    <label key={niche} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <Checkbox
                        checked={form.niches.includes(niche)}
                        onCheckedChange={() => toggleNiche(niche)}
                      />
                      {niche}
                    </label>
                  ))}
                </div>
                {errors.niches && <p className="text-xs text-destructive">{errors.niches}</p>}
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Follower Counts & Engagement</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Instagram Followers"
                    value={form.instagramFollowers}
                    onChange={(event) => setForm((prev) => ({ ...prev, instagramFollowers: event.target.value }))}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="YouTube Subscribers"
                    value={form.youtubeFollowers}
                    onChange={(event) => setForm((prev) => ({ ...prev, youtubeFollowers: event.target.value }))}
                  />
                  <div className="relative sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Average Engagement Rate (%)"
                      value={form.engagementRate}
                      onChange={(event) => setForm((prev) => ({ ...prev, engagementRate: event.target.value }))}
                      className="pr-7"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold">Social Media Content</h2>
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label>Instagram Posts</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://instagram.com/p/xxx"
                        value={newInstagramUrl}
                        onChange={(e) => setNewInstagramUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInstagramPost())}
                      />
                      <Button type="button" onClick={addInstagramPost} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {instagramPosts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {instagramPosts.map((post, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-sm"
                          >
                            <span className="max-w-[200px] truncate">{post.url}</span>
                            <button
                              type="button"
                              onClick={() => removeInstagramPost(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>YouTube Videos</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=xxx"
                        value={newYoutubeUrl}
                        onChange={(e) => setNewYoutubeUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addYouTubeVideo())}
                      />
                      <Button type="button" onClick={addYouTubeVideo} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {youtubeVideos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {youtubeVideos.map((video, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-sm"
                          >
                            <span className="max-w-[200px] truncate">{video.url}</span>
                            <button
                              type="button"
                              onClick={() => removeYouTubeVideo(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
