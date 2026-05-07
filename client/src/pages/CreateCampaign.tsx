import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, X, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CampaignFileEntry {
  fileUrl: string;
  fileName: string;
  fileType: "brief" | "contract" | "other";
}

const FILE_TYPES = ["brief", "contract", "other"] as const;

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", deliverables: "" });
  const [files, setFiles] = useState<CampaignFileEntry[]>([]);
  const [fileType, setFileType] = useState<"brief" | "contract" | "other">("brief");
  const [createdTitle, setCreatedTitle] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl, fileUrl } = await api.getUploadUrl(file.name, file.type, "campaign");
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setFiles(prev => [...prev, { fileUrl, fileName: file.name, fileType }]);
      toast({ title: "File uploaded", description: file.name });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const campaign = await api.createCampaign({
        title: form.title,
        description: form.description,
        budget: 0,
        deadline: "",
        deliverables: form.deliverables,
        platform: "",
        niche: "",
      });
      await Promise.all(files.map(f => api.uploadCampaignFile(campaign.id, f.fileUrl, f.fileName, f.fileType)));
      setCreatedTitle(form.title);
      setDone(true);
      toast({ title: "Campaign Created", description: "Your campaign is live." });
    } catch {
      toast({ title: "Error", description: "Failed to create campaign.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4">
        <Card className="max-w-sm w-full p-10 space-y-5 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
          <div>
            <p className="font-bold text-xl mb-1">Campaign Created!</p>
            <p className="text-muted-foreground text-sm">"{createdTitle}" is live and ready for creator proposals.</p>
          </div>
          <Button onClick={() => navigate("/brand/dashboard")} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
            View Dashboard →
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/brand/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Campaign</h1>
          <p className="text-muted-foreground text-sm mt-1">Fill in the details to attract the right creators.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Campaign Name *</Label>
                <Input value={form.title} onChange={set("title")} placeholder="e.g. Summer Collection Launch" required />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Description *</Label>
                  <span title="If campaign brief is not mentioned clearly it would not be considered as creator or brand fault." className="cursor-help text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </div>
                <Textarea value={form.description} onChange={set("description")} placeholder="Describe your campaign goals and requirements" rows={4} required />
              </div>
              <div className="space-y-1.5">
                <Label>Deliverables *</Label>
                <Textarea value={form.deliverables} onChange={set("deliverables")} placeholder="e.g. 1 Instagram Reel + 2 Stories" rows={2} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Files</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">File Type</Label>
                <div className="flex gap-2">
                  {FILE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setFileType(t)}
                      className={`px-3 py-1 rounded-md text-sm border capitalize transition-colors ${fileType === t ? "bg-purple-600 text-white border-purple-600" : "border-border text-muted-foreground hover:border-purple-400"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading…" : "Browse & Upload File"}
              </Button>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.fileName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{f.fileType}</p>
                      </div>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Select file type above, then upload. Supports PDFs, docs, and images.</p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full py-6 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90" disabled={loading}>
            {loading ? "Creating Campaign…" : "Create Campaign"}
          </Button>
        </form>
      </div>
    </main>
  );
}
