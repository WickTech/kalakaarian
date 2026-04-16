import { Link } from "react-router-dom";
import { ArrowLeft, Plus, TrendingUp, CheckCircle, Clock, FileText, Users, Search, MessageSquare, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { api, Campaign, Proposal } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { CampaignFileUpload } from "@/components/CampaignFileUpload";
import { VideoReviewGrid } from "@/components/VideoReviewGrid";

const statusColors: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "secondary",
  open: "default",
  in_progress: "outline",
  completed: "secondary",
  cancelled: "destructive",
};

const statusIcons: Record<string, typeof FileText> = {
  draft: FileText,
  open: Clock,
  in_progress: TrendingUp,
  completed: CheckCircle,
};

export default function BrandDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaignProposals, setSelectedCampaignProposals] = useState<{campaignId: string, proposals: Proposal[]} | null>(null);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<Record<string, any>>({});
  const [filesData, setFilesData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError("Failed to load campaigns");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async (campaignId: string) => {
    setProposalsLoading(true);
    try {
      const data = await api.getProposalsForCampaign(campaignId);
      setSelectedCampaignProposals({ campaignId, proposals: data });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load proposals",
        variant: "destructive",
      });
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleRespondToProposal = async (proposalId: string, status: "accepted" | "rejected") => {
    try {
      await api.respondToProposal(proposalId, status);
      toast({
        title: "Success",
        description: `Proposal ${status} successfully`,
      });
      if (selectedCampaignProposals) {
        fetchProposals(selectedCampaignProposals.campaignId);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      });
    }
  };

  const fetchWorkflowAndFiles = async (campaignId: string) => {
    try {
      const [wf, fl] = await Promise.all([
        api.getCampaignWorkflow(campaignId),
        api.getCampaignFiles(campaignId),
      ]);
      setWorkflowData(prev => ({ ...prev, [campaignId]: wf }));
      setFilesData(prev => ({ ...prev, [campaignId]: fl }));
    } catch (err) {
      console.error('Error fetching workflow data:', err);
    }
  };

  const handleStageUpdate = async (campaignId: string, stage: string) => {
    try {
      await api.updateWorkflowStage(campaignId, stage);
      await fetchWorkflowAndFiles(campaignId);
      toast({ title: 'Success', description: 'Stage updated' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update stage', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (campaignId: string, fileUrl: string, fileName: string, fileType: string) => {
    try {
      await api.uploadCampaignFile(campaignId, fileUrl, fileName, fileType);
      await fetchWorkflowAndFiles(campaignId);
      toast({ title: 'Success', description: 'File uploaded' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    }
  };

  const handleVideoApprove = async (campaignId: string, videoIndex: number) => {
    try {
      await api.updateVideoStatus(campaignId, videoIndex, 'approved');
      await fetchWorkflowAndFiles(campaignId);
      toast({ title: 'Success', description: 'Video approved' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to approve video', variant: 'destructive' });
    }
  };

  const handleVideoRevision = async (campaignId: string, videoIndex: number, feedback: string) => {
    try {
      await api.updateVideoStatus(campaignId, videoIndex, 'revision', feedback);
      await fetchWorkflowAndFiles(campaignId);
      toast({ title: 'Success', description: 'Revision requested' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to request revision', variant: 'destructive' });
    }
  };

  const toggleExpand = async (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      await fetchWorkflowAndFiles(campaignId);
    }
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "open" || c.status === "in_progress").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };

  const getStatusDisplay = (status: string) => {
    if (status === "in_progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-700 via-cyan-600 to-sky-500 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/role-select"
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Brand Dashboard</h1>
            <p className="text-white/80">Welcome back, {user?.brandName || user?.name || "Brand"}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/15">
              <Link to="/messages">
                <MessageSquare className="h-4 w-4" />
                Messages
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/15">
              <Link to="/marketplace">
                <Search className="h-4 w-4" />
                Browse Influencers
              </Link>
            </Button>
            <Button asChild className="bg-white text-cyan-700 hover:bg-white/90">
              <Link to="/brand-campaign">
                <Plus className="h-4 w-4" />
                New Campaign
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Campaigns</CardTitle>
            <CardDescription>Manage and track all your campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns yet. Create your first campaign!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Proposals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const statusKey = campaign.status as keyof typeof statusColors;
                    const StatusIcon = statusIcons[statusKey] || FileText;
                    const isExpanded = expandedCampaign === campaign._id;
                    return (
                      <>
                        <TableRow key={campaign._id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(campaign._id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{campaign.title}</TableCell>
                          <TableCell>{campaign.genre}</TableCell>
                          <TableCell>₹{campaign.budget.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[statusKey] || "secondary"}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {getStatusDisplay(campaign.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => fetchProposals(campaign._id)}
                                >
                                  View Proposals
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Proposals for {campaign.title}</DialogTitle>
                                  <DialogDescription>Review and respond to influencers who applied.</DialogDescription>
                                </DialogHeader>
                                
                                {proposalsLoading ? (
                                  <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                  </div>
                                ) : selectedCampaignProposals?.proposals.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No proposals yet for this campaign.
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Influencer</TableHead>
                                        <TableHead>Bid</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedCampaignProposals?.proposals.map((prop) => (
                                        <TableRow key={prop._id}>
                                          <TableCell className="font-medium">{prop.influencerName}</TableCell>
                                          <TableCell>₹{prop.bidAmount.toLocaleString()}</TableCell>
                                          <TableCell className="max-w-xs truncate">{prop.message}</TableCell>
                                          <TableCell>
                                            <Badge variant={
                                              prop.status === "accepted" ? "default" : 
                                              prop.status === "rejected" ? "destructive" : "outline"
                                            }>
                                              {prop.status.toUpperCase()}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {prop.status === "pending" && (
                                              <div className="flex justify-end gap-2">
                                                <Button 
                                                  size="sm" 
                                                  variant="default" 
                                                  className="h-8 bg-green-600 hover:bg-green-700"
                                                  onClick={() => handleRespondToProposal(prop._id, "accepted")}
                                                >
                                                  <Check className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="destructive" 
                                                  className="h-8"
                                                  onClick={() => handleRespondToProposal(prop._id, "rejected")}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )}
                                            <Button size="sm" variant="ghost" asChild className="h-8 ml-2">
                                              <Link to="/messages">
                                                <MessageSquare className="h-4 w-4" />
                                              </Link>
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Workflow</h4>
                                  <WorkflowTimeline 
                                    currentStage={workflowData[campaign._id]?.stage || 'selected'}
                                    onStageChange={(stage) => handleStageUpdate(campaign._id, stage)}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Campaign Files</h4>
                                  <CampaignFileUpload 
                                    files={filesData[campaign._id] || []}
                                    onUpload={(url, name, type) => handleFileUpload(campaign._id, url, name, type)}
                                  />
                                </div>
                                {workflowData[campaign._id]?.videos && workflowData[campaign._id].videos.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Video Review</h4>
                                    <VideoReviewGrid 
                                      videos={workflowData[campaign._id].videos}
                                      onApprove={(idx) => handleVideoApprove(campaign._id, idx)}
                                      onRevision={(idx, feedback) => handleVideoRevision(campaign._id, idx, feedback)}
                                    />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
