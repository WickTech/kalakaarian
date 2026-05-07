import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Globe, Briefcase, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigateBack } from "@/hooks/useNavigateBack";

interface BrandPublic {
  companyName: string;
  industry: string;
  description?: string;
  website?: string;
  logo?: string;
  ownerName?: string;
  openCampaignCount: number;
}

export default function BrandPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const { goBack } = useNavigateBack("/marketplace");

  const { data: brand, isLoading } = useQuery<BrandPublic>({
    queryKey: ["brand-public", id],
    queryFn: () => api.getBrandPublicProfile(id!),
    enabled: !!id,
  });

  useEffect(() => { document.title = brand?.companyName ? `${brand.companyName} | Kalakaarian` : "Brand Profile | Kalakaarian"; }, [brand?.companyName]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Brand not found</p>
        <Link to="/marketplace" className="text-primary hover:underline">Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center gap-4">
        <button onClick={goBack} className="p-2 border border-border rounded-md hover:bg-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Brand Profile</h1>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-5">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.companyName}
              className="w-20 h-20 rounded-xl object-cover border border-border" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {brand.companyName?.[0] ?? '?'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{brand.companyName}</h2>
            {brand.ownerName && <p className="text-sm text-muted-foreground">{brand.ownerName}</p>}
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3" /> {brand.industry}
            </span>
          </div>
        </div>

        {brand.description && (
          <div className="p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border text-center">
            <p className="text-2xl font-bold">{brand.openCampaignCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Open Campaigns</p>
          </div>
          {brand.website && (
            <a href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`}
              target="_blank" rel="noopener noreferrer"
              className="p-4 rounded-xl border border-border text-center hover:bg-secondary transition-colors flex flex-col items-center justify-center gap-1">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Website</p>
            </a>
          )}
        </div>

        <Link to="/contact"
          className="block w-full text-center py-3 rounded-xl border border-primary text-primary hover:bg-primary/10 transition-colors font-medium">
          Contact Brand
        </Link>
      </div>
    </div>
  );
}
