import { Star, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-xl items-center justify-center">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">Kalakaarian</p>
            <CardTitle className="text-3xl font-bold">Choose Your Role</CardTitle>
            <CardDescription className="text-base">Connect Influencers with Brands</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-20 justify-start gap-4 border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-600/70 dark:bg-purple-950/40 dark:text-purple-200"
              onClick={() => navigate("/influencer/register")}
            >
              <Star className="h-6 w-6" />
              <span className="text-left">
                <span className="block text-lg font-semibold">I&apos;m an Influencer</span>
                <span className="block text-xs text-current/80">Register and showcase your creator profile</span>
              </span>
            </Button>

            <Button
              type="button"
              className="h-20 justify-start gap-4"
              onClick={() => navigate("/brand/campaign")}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-left">
                <span className="block text-lg font-semibold">I&apos;m a Brand</span>
                <span className="block text-xs text-primary-foreground/80">Create campaigns and find ideal influencers</span>
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
