import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, CheckCircle, Edit, User, Instagram, Youtube, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { api, Proposal, InfluencerProfile } from "@/lib/api";

const statusColors: Record<string, "outline" | "default" | "secondary" | "destructive"> = {
  pending: "outline",
  accepted: "default",
  rejected: "destructive",
};

const getStatusDisplay = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proposalsData, profileData] = await Promise.all([
          api.getProposals().catch(() => []),
          api.getInfluencerProfile().catch(() => null),
        ]);
        setProposals(proposalsData);
        setProfile(profileData);
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: proposals.length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    earnings: proposals
      .filter((p) => p.status === "accepted")
      .reduce((sum, p) => sum + p.bidAmount, 0),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/role-select"
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Influencer Dashboard</h1>
            <p className="text-white/80">Welcome back, {user?.name || "Influencer"}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/15">
              <Link to="/campaigns">
                Browse Campaigns
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/15">
              <Link to="/influencer-profile">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
                </div>
              ) : profile ? (
                <>
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Niches</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profile.niches?.map((niche) => (
                        <Badge key={niche} variant="secondary">
                          {niche}
                        </Badge>
                      )) || <span className="text-muted-foreground">No niches set</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Followers</p>
                    <div className="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="font-bold">{(profile.followers?.instagram || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Instagram</p>
                      </div>
                      <div>
                        <p className="font-bold">{(profile.followers?.youtube || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">YouTube</p>
                      </div>
                      <div>
                        <p className="font-bold">{(profile.followers?.total || profile.followerCount || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                  {(profile.socialHandles?.instagram || profile.socialHandles?.youtube) && (
                    <div>
                      <p className="text-sm font-medium">Social Links</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.socialHandles?.instagram && (
                          <a
                            href={`https://instagram.com/${profile.socialHandles.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-sm text-white hover:opacity-90"
                          >
                            <Instagram className="h-4 w-4" />
                            @{profile.socialHandles.instagram.replace('@', '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {profile.socialHandles?.youtube && (
                          <a
                            href={profile.socialHandles.youtube.startsWith('http') ? profile.socialHandles.youtube : `https://youtube.com/@${profile.socialHandles.youtube.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                          >
                            <Youtube className="h-4 w-4" />
                            YouTube
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No profile data. Complete your profile to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted Proposals</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.accepted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.earnings.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Proposals</CardTitle>
            <CardDescription>Track the status of your campaign proposals</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No proposals yet. Browse campaigns to apply!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal._id}>
                      <TableCell className="font-medium">{proposal.campaignTitle}</TableCell>
                      <TableCell>₹{proposal.bidAmount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(proposal.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[proposal.status] || "secondary"}>
                          {getStatusDisplay(proposal.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
