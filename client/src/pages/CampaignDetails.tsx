import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { api, Campaign, Proposal } from "@/lib/api";

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: campaign, isLoading, isError } = useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: () => api.getCampaignById(id!),
    enabled: !!id,
  });

  const { data: proposal = null } = useQuery<Proposal | null>({
    queryKey: ['my-proposal', id],
    queryFn: () => api.getMyProposalForCampaign(id!).catch(() => null),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </main>
    );
  }

  if (isError || !campaign) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Campaigns
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{isError ? "Failed to load campaign." : "Campaign not found."}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const statusColors: Record<string, "outline" | "default" | "secondary" | "destructive"> = {
    pending: "outline", accepted: "default", rejected: "destructive",
  };
  const statusIcons: Record<string, typeof Clock> = {
    pending: Clock, accepted: CheckCircle, rejected: XCircle,
  };
  const StatusIcon = proposal ? statusIcons[proposal.status] : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{campaign.title}</CardTitle>
                <CardDescription className="text-base">{campaign.brandName}</CardDescription>
              </div>
              <Badge variant="secondary">{campaign.genre}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {campaign.platform && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Platform</p>
                  <p className="font-semibold">{campaign.platform}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground">{campaign.description}</p>
            </div>

            {campaign.deliverables && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Deliverables</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{campaign.deliverables}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {proposal ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Your Proposal
              </CardTitle>
              <CardDescription>You have already applied to this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Price</p>
                  <p className="text-xl font-bold">₹{proposal.bidAmount.toLocaleString()}</p>
                </div>
                <Badge variant={statusColors[proposal.status] || "secondary"}>
                  {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
              </div>
              {proposal.message && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Your Message</p>
                    <p className="text-sm text-muted-foreground">{proposal.message}</p>
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted on {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to apply?</p>
                  <p className="text-sm text-muted-foreground">Submit your proposal with your rate and timeline</p>
                </div>
                <Button onClick={() => navigate(`/campaign/${id}/propose`)}>Submit Proposal</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
