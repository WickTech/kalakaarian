import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  { icon: FileText, title: "Campaign Brief", desc: "Upload briefs and contracts directly to your campaign." },
  { icon: Target,   title: "Targeted Reach", desc: "Filter creators by niche, platform, tier, and audience." },
  { icon: Users,    title: "Creator Proposals", desc: "Receive and review proposals from matched creators." },
];

export default function BrandCampaignPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link to="/brand/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold">Brand Campaigns</h1>
          <p className="text-muted-foreground mt-2">Launch campaigns, upload briefs, and connect with creators who match your goals.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="w-6 h-6 text-purple-600" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </main>
  );
}
