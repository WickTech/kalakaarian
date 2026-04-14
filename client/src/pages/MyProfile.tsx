import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Edit, Instagram, Youtube, Twitter, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api, InfluencerProfile, BrandProfile } from "@/lib/api";

interface InfluencerProfileView extends InfluencerProfile {
  tiktokHandle?: string;
  twitterHandle?: string;
  followers?: {
    instagram?: number;
    youtube?: number;
    tiktok?: number;
    twitter?: number;
    total?: number;
  };
  engagementRate?: number;
  posts?: Array<{
    id: string;
    imageUrl: string;
    postUrl: string;
    likes?: number;
  }>;
  videos?: Array<{
    id: string;
    thumbnailUrl: string;
    title: string;
    videoUrl: string;
    views?: number;
  }>;
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [influencerProfile, setInfluencerProfile] = useState<InfluencerProfileView | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"instagram" | "youtube">("instagram");

  const isInfluencer = user?.role === "influencer";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isInfluencer) {
          const profile = await api.getInfluencerProfile();
          setInfluencerProfile(profile);
        } else {
          const profile = await api.getBrandProfile();
          setBrandProfile(profile);
        }
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
  }, [isInfluencer, toast]);

  const handleEdit = () => {
    if (isInfluencer) {
      navigate("/profile/edit");
    } else {
      navigate("/profile/edit");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isInfluencer && influencerProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <Button onClick={handleEdit} className="bg-white text-purple-700 hover:bg-white/90">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-700 dark:text-purple-300">{influencerProfile.name}</CardTitle>
              <CardDescription>Influencer Profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold">Bio</h3>
                <p className="text-muted-foreground">{influencerProfile.bio || "No bio provided"}</p>
              </div>

              {influencerProfile.niches && influencerProfile.niches.length > 0 && (
                <div>
                  <h3 className="font-semibold">Niches</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {influencerProfile.niches.map((niche) => (
                      <span
                        key={niche}
                        className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold">Social Media</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {influencerProfile.instagramHandle && (
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <span className="text-sm">{influencerProfile.instagramHandle}</span>
                    </div>
                  )}
                  {influencerProfile.youtubeHandle && (
                    <div className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{influencerProfile.youtubeHandle}</span>
                    </div>
                  )}
                  {influencerProfile.tiktokHandle && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-black" />
                      <span className="text-sm">{influencerProfile.tiktokHandle}</span>
                    </div>
                  )}
                  {influencerProfile.twitterHandle && (
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{influencerProfile.twitterHandle}</span>
                    </div>
                  )}
                  {!influencerProfile.instagramHandle &&
                    !influencerProfile.youtubeHandle &&
                    !influencerProfile.tiktokHandle &&
                    !influencerProfile.twitterHandle && (
                      <p className="text-sm text-muted-foreground">No social handles provided</p>
                    )}
                </div>
              </div>

              {(influencerProfile.followers || influencerProfile.engagementRate) && (
                <div>
                  <h3 className="font-semibold">Stats</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <div className="space-y-1">
                      <span className="text-xs uppercase text-muted-foreground">Followers</span>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        <span className="font-semibold">
                          {influencerProfile.followers?.instagram
                            ? `${(influencerProfile.followers.instagram / 1000).toFixed(1)}K`
                            : "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-600" />
                        <span className="font-semibold">
                          {influencerProfile.followers?.youtube
                            ? `${(influencerProfile.followers.youtube / 1000).toFixed(1)}K`
                            : "0"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs uppercase text-muted-foreground">Subscribers</span>
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-600" />
                        <span className="font-semibold">
                          {influencerProfile.followers?.youtube
                            ? `${(influencerProfile.followers.youtube / 1000).toFixed(1)}K`
                            : "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Engagement</span>
                        <span className="font-semibold text-green-600">
                          {influencerProfile.engagementRate?.toFixed(1) || "0"}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3 font-semibold">Content</h3>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => setActiveTab("instagram")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      activeTab === "instagram"
                        ? "brand-gradient text-primary-foreground"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram ({influencerProfile.posts?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("youtube")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      activeTab === "youtube"
                        ? "brand-gradient text-primary-foreground"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <Youtube className="h-4 w-4" />
                    YouTube ({influencerProfile.videos?.length || 0})
                  </button>
                </div>

                {activeTab === "instagram" && (
                  <div className="min-h-[200px] rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                    {influencerProfile.posts && influencerProfile.posts.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {influencerProfile.posts.map((post) => (
                          <a
                            key={post.id}
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-200"
                          >
                            <img
                              src={post.imageUrl}
                              alt="Instagram post"
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                        <p>No Instagram posts yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "youtube" && (
                  <div className="min-h-[200px] rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                    {influencerProfile.videos && influencerProfile.videos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {influencerProfile.videos.map((video) => (
                          <a
                            key={video.id}
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden rounded-lg bg-gray-200"
                          >
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="aspect-video w-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="line-clamp-2 text-sm font-medium text-white">{video.title}</p>
                              {video.views && (
                                <p className="text-xs text-gray-300">{video.views.toLocaleString()} views</p>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                        <p>No YouTube videos yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (brandProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-500 px-4 py-10">
        <div className="w-full max-w-xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <Button onClick={handleEdit} className="bg-white text-blue-700 hover:bg-white/90">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{brandProfile.companyName}</CardTitle>
              <CardDescription>Brand Profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandProfile.contactPerson && (
                <div>
                  <h3 className="font-semibold">Contact Person</h3>
                  <p className="text-muted-foreground">{brandProfile.contactPerson}</p>
                </div>
              )}

              {brandProfile.email && (
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-muted-foreground">{brandProfile.email}</p>
                </div>
              )}

              {brandProfile.phone && (
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-muted-foreground">{brandProfile.phone}</p>
                </div>
              )}

              {brandProfile.industry && (
                <div>
                  <h3 className="font-semibold">Industry</h3>
                  <p className="text-muted-foreground">{brandProfile.industry}</p>
                </div>
              )}

              {brandProfile.website && (
                <div>
                  <h3 className="font-semibold">Website</h3>
                  <a
                    href={brandProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {brandProfile.website}
                  </a>
                </div>
              )}

              {brandProfile.description && (
                <div>
                  <h3 className="font-semibold">Company Bio</h3>
                  <p className="text-muted-foreground">{brandProfile.description}</p>
                </div>
              )}

              {!brandProfile.contactPerson &&
                !brandProfile.email &&
                !brandProfile.phone &&
                !brandProfile.industry &&
                !brandProfile.website &&
                !brandProfile.description && (
                  <p className="text-muted-foreground">No profile details available. Click Edit Profile to add details.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>You haven't completed your profile yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleEdit} className="w-full">
            Complete Your Profile
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
