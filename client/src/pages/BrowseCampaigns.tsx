import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Calendar, DollarSign, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, Campaign, CampaignFilters } from "@/lib/api";

const genres = ["Fashion", "Tech", "Food", "Fitness", "Beauty", "Lifestyle", "Gaming", "Travel"];

export default function BrowseCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const data = await api.getOpenCampaigns(filters);
        setCampaigns(data);
        setError(null);
      } catch (err) {
        setError("Failed to load campaigns");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [filters]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (searchTerm && !campaign.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.niche && campaign.genre !== filters.niche) {
      return false;
    }
    if (filters.minBudget && campaign.budget < filters.minBudget) {
      return false;
    }
    if (filters.maxBudget && campaign.budget > filters.maxBudget) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/influencer/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white">Browse Campaigns</h1>
          <p className="text-white/80">Find open campaigns that match your niche and style</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={filters.niche || ""}
                  onValueChange={(value) => setFilters({ ...filters, niche: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Niches</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={
                    filters.maxBudget
                      ? filters.maxBudget <= 30000
                        ? "0-30000"
                        : filters.maxBudget <= 60000
                        ? "30001-60000"
                        : "60000+"
                      : ""
                  }
                  onValueChange={(value) => {
                    const budgetMap: Record<string, { minBudget?: number; maxBudget?: number }> = {
                      "0-30000": { maxBudget: 30000 },
                      "30001-60000": { minBudget: 30001, maxBudget: 60000 },
                      "60000+": { minBudget: 60001 },
                    };
                    setFilters({ ...filters, ...budgetMap[value] });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Budget Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Budgets</SelectItem>
                    <SelectItem value="0-30000">Under ₹30,000</SelectItem>
                    <SelectItem value="30001-60000">₹30,000 - ₹60,000</SelectItem>
                    <SelectItem value="60000+">₹60,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No campaigns found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <CardDescription>{campaign.brandName}</CardDescription>
                    </div>
                    <Badge variant="secondary">{campaign.genre}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">₹{campaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
                    </div>
                    {campaign.platform && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{campaign.platform}</span>
                      </div>
                    )}
                  </div>
                  <Button asChild className="w-full">
                    <Link to={`/campaign/${campaign.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
