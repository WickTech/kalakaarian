import { Link } from "react-router-dom";
import { ArrowLeft, Plus, TrendingUp, CheckCircle, Clock, FileText, Users, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { api, Campaign } from "@/lib/api";

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    fetchCampaigns();
  }, []);

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
                    <TableHead>Campaign</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const statusKey = campaign.status as keyof typeof statusColors;
                    const StatusIcon = statusIcons[statusKey] || FileText;
                    return (
                      <TableRow key={campaign._id}>
                        <TableCell className="font-medium">{campaign.title}</TableCell>
                        <TableCell>{campaign.genre}</TableCell>
                        <TableCell>₹{campaign.budget.toLocaleString()}</TableCell>
                        <TableCell>{new Date(campaign.deadline).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[statusKey] || "secondary"}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {getStatusDisplay(campaign.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
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
