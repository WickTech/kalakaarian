import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, Campaign } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SubmitProposal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    price: "",
    message: "",
  });

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const data = await api.getCampaignById(id!);
        setCampaign(data);
      } catch (err) {
        setError("Failed to load campaign");
        console.error(err);
      }
    };
    if (id) fetchCampaign();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.price || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.submitProposal(id!, formData.message, Number(formData.price));
      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been sent to the brand.",
        variant: "default",
      });
      navigate("/influencer/dashboard");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Campaigns
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{error || "Campaign not found."}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to={`/campaign/${id}`}
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Campaign
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Submit Proposal</CardTitle>
            <CardDescription>Apply for: {campaign.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium">{campaign.brandName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget Range</span>
                <span className="font-medium">₹{campaign.budget.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">{new Date(campaign.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Proposal</CardTitle>
            <CardDescription>Fill in your proposal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">
                  <DollarSign className="mr-1 h-4 w-4 inline" />
                  Your Price (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter your proposed price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Suggested: Between ₹{Math.floor(campaign.budget * 0.5).toLocaleString()} and ₹
                  {Math.floor(campaign.budget * 1.2).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  <FileText className="mr-1 h-4 w-4 inline" />
                  Cover Letter / Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself, explain why you're a good fit, and any relevant experience..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
