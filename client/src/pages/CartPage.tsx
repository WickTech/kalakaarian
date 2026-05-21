import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Upload, FileText, ShoppingCart, Plus, Loader2, Check } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { api, CampaignFile } from "@/lib/api";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, total, campaignId, campaignName, campaignDescription, setCampaign, setCampaignDescription } = useCartContext();

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [files, setFiles] = useState<CampaignFile[]>([]);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (campaignId) api.getCampaignFiles(campaignId).then(setFiles).catch(() => {});
    else setFiles([]);
  }, [campaignId]);

  const handleCreateCampaign = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setCreating(true);
    try {
      const camp = await api.createCampaign({ title: newTitle, description: newDesc });
      setCampaign(camp.title, camp.id);
      setCampaignDescription(newDesc);
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!campaignId || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const { uploadUrl, fileUrl } = await api.getUploadUrl(file.name, file.type, "campaign");
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        const saved = await api.uploadCampaignFile(campaignId, fileUrl, file.name, file.type);
        setFiles(prev => [...prev, saved]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!campaignId) return;
    await api.deleteCampaignFile(campaignId, fileId).catch(() => {});
    setFiles(prev => prev.filter(f => f._id !== fileId));
  };

  const platformFee = Math.round(total * 0.08);
  const gst = Math.round((total + platformFee) * 0.18);
  const grand = total + platformFee + gst;

  // Gated on a created campaign (name + description enforced at creation) + brief file.
  const canCheckout = items.length > 0 && !!campaignId && files.length > 0;
  const checkoutHint = !campaignId ? "Create a campaign (name + description) to continue"
    : files.length === 0 ? "Upload at least one campaign brief file" : "";

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">Your cart is empty</p>
          <button onClick={() => navigate("/marketplace")} className="purple-pill px-6 py-2 text-sm font-bold">
            Browse Kalakaars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-28">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" /> Cart ({items.length})
        </h1>

        {/* Creators */}
        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
          {items.map(item => (
            <div key={item.influencer.id} className="flex items-center gap-3 p-3">
              <img src={item.influencer.photo} alt={item.influencer.name} className="w-10 h-10 rounded-full object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.influencer.name}</p>
                <p className="text-xs text-muted-foreground">{item.influencer.handle || "—"}</p>
              </div>
              <span className="text-sm font-mono font-bold text-primary shrink-0">
                {item.influencer.price ? fmt(item.influencer.price) : "TBD"}
              </span>
              <button onClick={() => removeFromCart(item.influencer.id)} className="p-1 text-muted-foreground hover:text-destructive shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Campaign */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Campaign
          </p>

          {campaignId ? (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 px-3 py-2.5 rounded-lg">
              <div>
                <p className="text-sm font-medium">{campaignName}</p>
                {campaignDescription && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{campaignDescription}</p>}
              </div>
              <button onClick={() => { setCampaign("", ""); setFiles([]); }} className="text-xs text-muted-foreground hover:text-destructive ml-3 shrink-0">
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Campaign name *"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:border-primary" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Campaign description / brief *" rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:border-primary resize-none" />
              <button onClick={handleCreateCampaign} disabled={!newTitle.trim() || !newDesc.trim() || creating}
                className="purple-pill px-4 py-1.5 text-xs font-bold disabled:opacity-40 flex items-center gap-1.5">
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Create Campaign
              </button>
            </div>
          )}
        </div>

        {/* Campaign Brief Upload — shown once campaign is linked */}
        {campaignId && (
          <div className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Campaign Brief
              </p>
              <label className={`text-xs px-3 py-1.5 rounded-full border border-border cursor-pointer hover:bg-muted transition-colors flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Upload Files
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Share your brand guidelines, mood board, or creative direction. (PDF, DOC, Images)</p>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f._id} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-xs text-primary hover:underline truncate">{f.fileName}</a>
                    <button onClick={() => handleDeleteFile(f._id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="border border-border rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Kalakaar Subtotal</span><span>{fmt(total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee (8%)</span><span>{fmt(platformFee)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>{fmt(gst)}</span></div>
          <div className="h-px bg-border" />
          <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span className="text-primary">{fmt(grand)}</span></div>
        </div>
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-2xl mx-auto space-y-2">
          {checkoutHint && (
            <p className="text-xs text-amber-500 text-center">{checkoutHint}</p>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate("/marketplace")} className="btn-outline flex-1 py-2.5 text-sm">
              + Add Kalakaars
            </button>
            <button onClick={() => navigate("/checkout")} disabled={!canCheckout}
              className="purple-pill py-2.5 text-sm font-bold px-8 disabled:opacity-40 disabled:cursor-not-allowed">
              Checkout · {fmt(grand)} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
